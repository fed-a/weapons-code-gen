modded class PluginRecipesManagerBase extends PluginBase
{
  override void RegisterRecipies()
  {
    super.RegisterRecipies();
		
    RegisterRecipe(new Paint_Sword_AgentBronto);

  }       
}