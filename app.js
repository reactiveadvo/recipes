const imagePaths = {
  chickpeas: "./src/assets/chickpea-stew.jpg",
  chicken: "./src/assets/roast-chicken.jpg",
  pasta: "./src/assets/tomato-pasta.jpg",
};

const feed = document.getElementById("recipe-feed");
const recipeCount = document.getElementById("recipe-count");
const modal = document.getElementById("recipe-modal");
const dialog = modal.querySelector(".recipe-dialog");
const detailContent = document.getElementById("recipe-detail-content");
const closeRecipeButton = document.getElementById("button-close-recipe");
const dismissRecipeButton = document.getElementById("button-dismiss-recipe");

let recipes = [];
let randomRecipeId = null;
let lastTrigger = null;
let previousBodyOverflow = "";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function renderRecipes() {
  const visibleRecipes = randomRecipeId
    ? recipes.filter((recipe) => recipe.id === randomRecipeId)
    : recipes;

  recipeCount.textContent = `${visibleRecipes.length} ${visibleRecipes.length === 1 ? "recipe" : "recipes"}`;
  feed.innerHTML = visibleRecipes.map((recipe, index) => {
    const imagePath = imagePaths[recipe.imageKey];
    return `
      <article class="recipe-card" data-testid="card-recipe-${escapeHtml(recipe.id)}">
        <div class="recipe-photo-wrap">
          <button type="button" class="photo-open" data-recipe-id="${escapeHtml(recipe.id)}" aria-label="Open ${escapeHtml(recipe.title)} recipe">
            <img class="recipe-photo" src="${escapeHtml(imagePath)}" alt="${escapeHtml(recipe.imageAlt)}" ${index > 2 ? 'loading="lazy"' : 'loading="eager"'}>
          </button>
        </div>
        <button type="button" class="recipe-card-body" data-recipe-id="${escapeHtml(recipe.id)}">
          <span class="recipe-meta">${escapeHtml(recipe.time)} · Serves ${escapeHtml(recipe.serves)}</span>
          <h2>${escapeHtml(recipe.title)}</h2>
          <p>${escapeHtml(recipe.description)}</p>
          <span class="card-arrow">View recipe <span aria-hidden="true">→</span></span>
        </button>
      </article>`;
  }).join("");

  if (!visibleRecipes.length) {
    feed.innerHTML = '<p class="empty-state">No recipes are available.</p>';
  }
}

function openRecipe(recipe, trigger) {
  lastTrigger = trigger;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  detailContent.innerHTML = `
    <div class="dialog-hero">
      <img src="${escapeHtml(imagePaths[recipe.imageKey])}" alt="${escapeHtml(recipe.imageAlt)}">
      <div class="dialog-hero-title"><h2 id="dialog-recipe-title">${escapeHtml(recipe.title)}</h2></div>
    </div>
    <div class="dialog-content">
      <p class="recipe-deck">${escapeHtml(recipe.description)}</p>
      <div class="detail-facts" aria-label="Recipe details">
        <div class="fact"><small>Time</small><strong>${escapeHtml(recipe.time)}</strong></div>
        <div class="fact"><small>Serves</small><strong>${escapeHtml(recipe.serves)}</strong></div>
      </div>
      <div class="recipe-columns">
        <section aria-labelledby="ingredients-heading">
          <h3 id="ingredients-heading">Ingredients</h3>
          <ul class="ingredient-list">
            ${recipe.ingredients.map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join("")}
          </ul>
        </section>
        <section aria-labelledby="steps-heading">
          <h3 id="steps-heading">Instructions</h3>
          <ol class="step-list">
            ${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
          </ol>
        </section>
      </div>
    </div>`;

  modal.hidden = false;
  dialog.focus();
}

function closeRecipe() {
  modal.hidden = true;
  document.body.style.overflow = previousBodyOverflow;
  lastTrigger?.focus();
}

function scrollToFeed() {
  document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
}

feed.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-recipe-id]");
  if (!trigger) return;
  const recipe = recipes.find((item) => item.id === trigger.dataset.recipeId);
  if (recipe) openRecipe(recipe, trigger);
});

document.getElementById("button-random-recipe").addEventListener("click", () => {
  if (!recipes.length) return;
  randomRecipeId = recipes[Math.floor(Math.random() * recipes.length)].id;
  renderRecipes();
  scrollToFeed();
});

document.getElementById("button-reset-feed").addEventListener("click", () => {
  randomRecipeId = null;
  renderRecipes();
  scrollToFeed();
});

document.getElementById("button-scroll-to-top").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

closeRecipeButton.addEventListener("click", closeRecipe);
dismissRecipeButton.addEventListener("click", closeRecipe);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeRecipe();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeRecipe();
});

fetch("./src/recipes.json")
  .then((response) => {
    if (!response.ok) throw new Error(`Recipe data returned ${response.status}`);
    return response.json();
  })
  .then((data) => {
    if (!Array.isArray(data)) throw new Error("Recipe data must be a JSON array");
    recipes = data;
    renderRecipes();
  })
  .catch((error) => {
    console.error("Could not load the recipe list.", error);
    recipeCount.textContent = "Recipes unavailable";
    feed.innerHTML = '<p class="empty-state load-error">The recipe list could not be loaded. Please refresh the page.</p>';
  });
