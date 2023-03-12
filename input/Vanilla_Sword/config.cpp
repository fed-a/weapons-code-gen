class CfgPatches {
	class DZ_Weapons_Melee_Blade_SV_Dono {
		units[] = {};
		weapons[] = {};
		requiredVersion = 0.1;
		requiredAddons[] = {"DZ_Weapons_Melee"};
	};
};

class CfgVehicles {
	class Sword;	// External class reference

	class Sword_AgentBronto : Sword {
		scope = 2;
		displayName = "AgentBronto's Armband";
		descriptionShort="Customized Donator Weapon. Designed by Warlord.";
		hiddenSelections[] = 
		{
			"zbytek"
		};
		hiddenSelectionsTextures[] =
		{
			"SV_Custom_2\Donator\CustomWeapons\AgentBronto_Sword\AgentBronto_Sword.paa"
		};
		hiddenSelectionsMaterials[] = {"SV_Custom_2\Donator\CustomWeapons\AgentBronto_Sword\AgentBronto_Sword.rvmat"};
	};
};