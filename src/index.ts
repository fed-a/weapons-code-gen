import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import Path from "path";
import Inquirer from "inquirer";
// @ts-ignore
import { SimpleParser } from "./parser.cjs";

const DEBUG = false;
let errors = 0;

const CLASS_NAME_TEMPLATE = "$$$CLASSNAME$$$";
const MAIN_CLASS_TEMPLATE = "$$$MAIN_CLASS$$$";
const DISPLAY_NAME_TEMPLATE = "$$$DISPLAYNAME$$$";
const REGISTER_RECIPES_TEMPLATE = "$$$REGISTER_RECIPES$$$";
const INGREDIENT_NAME_TEMPLATE = "$$$INGREDIENT_NAME$$$";
let INGREDIENT_NAME = "";

const paintTemplate = readFileSync(
  Path.join(__dirname, "templates", "paint-template.c"),
  "utf8"
);
const recipeTemplate = readFileSync(
  Path.join(__dirname, "templates", "recipes-template.c"),
  "utf8"
);

const registerRecipeTemplate = (classname: string) =>
  `    RegisterRecipe(new Paint_${classname});`;

function createDirectoryRecursively(path: string) {
  if (!existsSync(path)) {
    createDirectoryRecursively(Path.dirname(path));
    mkdirSync(path, { recursive: true });
  }
}

async function writeFile(path: string, content: string) {
  if (DEBUG) console.log("writeFile", path);
  const dir = Path.dirname(path);
  try {
    createDirectoryRecursively(dir);
  } catch (error) {
    errors += 1;
    console.error("ERROR CREATING DIR", dir, error);
    return;
  }
  writeFileSync(path, content, "utf8");
  console.log("File written: ", path);
}

async function readDirectory(directory: string): Promise<string[]> {
  const files = await readdirSync(directory);
  const filesPromises = files.map(async (file: string) => {
    try {
      const absolutePath = Path.join(directory, file);
      const fileStat = await statSync(absolutePath);
      if (fileStat.isDirectory()) {
        return await readDirectory(absolutePath);
      } else {
        return absolutePath;
      }
    } catch (err) {
      console.error("error", err);
      // error handling
      return [];
    }
  });
  const filesWithArrays = await Promise.all(filesPromises);
  const flatArray = filesWithArrays.reduce<string[]>(
    (acc, fileOrArray) => acc.concat(fileOrArray),
    []
  );
  return flatArray;
}

function mapContentToParser(content: string, debug = false) {
  const parser = new SimpleParser(content, debug);
  return parser.generateEntities();
}

function generatePaintFileContent(info: {
  classNames: string[];
  displayNames: string[];
  mainClassName: string;
}) {
  let content = "";
  info.classNames.forEach((classname, index) => {
    content +=
      paintTemplate
        .replaceAll(CLASS_NAME_TEMPLATE, classname)
        .replaceAll(MAIN_CLASS_TEMPLATE, info.mainClassName)
        .replaceAll(INGREDIENT_NAME_TEMPLATE, INGREDIENT_NAME)
        .replaceAll(DISPLAY_NAME_TEMPLATE, info.displayNames[index]) + "\n\n";
  });
  return content;
}

function generateRecipesFileContent(classNames: string[]) {
  let registers = "";
  classNames.forEach((classname) => {
    registers += registerRecipeTemplate(classname) + "\n";
  });

  let content = recipeTemplate.replaceAll(REGISTER_RECIPES_TEMPLATE, registers);

  return content;
}

async function main({
  inputFolder = "input",
  ingredientName = "",
}: {
  inputFolder: string;
  ingredientName: string;
}) {
  const files = await readDirectory(inputFolder);
  INGREDIENT_NAME = ingredientName;
  const parsedFiles = await Promise.all(
    files.map(async (file) => {
      const content = await readFileSync(file, "utf8");

      const parsedFileContent = mapContentToParser(content) as {
        classNames: string[];
        displayNames: string[];
        mainClassName: string;
      };

      return {
        file,
        parsedFileContent,
      };
    })
  );

  console.log("------------------------------------");
  console.log("-----РЕЗУЛЬТАТ ОБРАБОТКИ ФАЙЛОВ-----");
  console.log("------------------------------------");

  parsedFiles.forEach(({ file, parsedFileContent }) => {
    const { classNames, displayNames, mainClassName } = parsedFileContent;
    console.log(`┌file: ${file}`);
    console.log("├--┬mainClassName:");
    if (mainClassName === "") {
      console.warn(
        "|  └----------------------ВНИМАНИЕ: потенциальная ошибка. Главный classname пустой"
      );
    }
    console.log(`|  └${mainClassName}`);
    console.log("├--┬classnames:");
    if (classNames.length === 0) {
      console.warn(
        "|  └----------------------ВНИМАНИЕ: потенциальная ошибка. Нет classname`ов"
      );
    }
    classNames.forEach((classname, index) => {
      console.log(
        `|  ${index === classNames.length - 1 ? "└" : "├--"}${classname}`
      );
    });
    console.log("└--┬displayNames:");
    if (displayNames.length === 0) {
      console.warn(
        "   └----------------------ВНИМАНИЕ: потенциальная ошибка. Нет displayname`ов"
      );
    }
    displayNames.forEach((displayname, index) => {
      console.log(
        `   ${index === displayNames.length - 1 ? "└" : "├--"}${displayname}`
      );
    });
  });

  if (parsedFiles.length === 0) {
    console.log("Нет файлов :(");
    return;
  }

  console.log("---------------------------");
  console.log("-----ЗАПИСЬ РЕЗУЛЬТАТА-----");
  console.log("---------------------------");
  await Promise.all([
    ...parsedFiles.map((file) => {
      if (DEBUG) console.log({ file: file.file });

      return Promise.all([
        writeFile(
          Path.join(
            "output",
            `Paint_${file.parsedFileContent.mainClassName}.c`
          ),
          generatePaintFileContent(file.parsedFileContent)
        ),
      ]);
    }),
    writeFile(
      Path.join("output", `Recipes.c`),
      generateRecipesFileContent(
        parsedFiles.map((file) => file.parsedFileContent.classNames).flat()
      )
    ),
  ]);

  console.log();
  console.log("------------------------------------");
  console.log();
  if (errors > 0) {
    console.error("𐄂 При выполнении возникли ошибки :(");
  } else {
    console.log("✔ Все файлы успешно сгенерированы");
  }
  Inquirer.prompt([
    {
      type: "confirm",
      name: "continue",
      message: "Нажмите Enter для выхода",
    },
  ]);
}

const askInputFolder = async () => {
  const answer = await Inquirer.prompt([
    {
      type: "input",
      name: "folder",
      message: "Введите название папки с исходными файлами",
      default: "input",
    },
    {
      type: "input",
      name: "ingredientName",
      message: "Введите название ингредиента",
      default: "Spraycan_Weapon",
    },
  ]);
  main({
    inputFolder: answer.folder,
    ingredientName: answer.ingredientName,
  });
};

askInputFolder();
