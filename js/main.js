import { loadCourse } from "./dataLoader.js";
import { SortingGame } from "./dragDrop.js";
import { Quiz } from "./quiz.js";
import { makeElement, animateNumber } from "./utils.js";

class GameState {
  constructor() {
    this.reset();
  }
  reset() {
    this.learnerName = "";
    this.gameScore = 0;
    this.quizScore = 0;
    this.quizAnswered = 0;
    this.currentScreen = "welcome";
    this.sortedItems = new Set();
    this.tries = {};
    this.viewedBins = new Set();
  }
}

const state = new GameState();
const $ = (selector) => document.querySelector(selector);
const screens = [...document.querySelectorAll("[data-screen]")];
let courseData;
let game;
let quiz;

const showScreen = (name) => {
  state.currentScreen = name;
  screens.forEach((screen) => {
    const active = screen.dataset.screen === name;
    screen.hidden = !active;
    screen.classList.toggle("is-visible", active);
  });
  const stepOrder = ["welcome", "learn", "game", "quiz", "results"];
  document.querySelectorAll("[data-step]").forEach((step) => {
    step.classList.toggle("is-active", step.dataset.step === name);
    step.classList.toggle(
      "is-complete",
      stepOrder
        .filter(
          (stepName) => stepOrder.indexOf(stepName) < stepOrder.indexOf(name),
        )
        .includes(step.dataset.step),
    );
  });
  const activeStep = document.querySelector(`[data-step="${name}"]`);
  const nav = $(".steps");
  nav.dataset.current = activeStep?.textContent || name;
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
};

const renderLearnCards = () => {
  const host = $("#learn-cards");
  host.replaceChildren();
  courseData.bins.forEach((bin) => {
    const article = makeElement("article", "learn-card");
    article.dataset.binId = bin.id;
    article.style.setProperty("--bin-color", bin.color);
    const button = makeElement("button", "learn-card__button");
    button.type = "button";
    button.setAttribute("aria-label", `Explore ${bin.label} bin`);
    const inner = makeElement("span", "learn-card__inner");
    const front = makeElement("span", "learn-card__face learn-card__front");
    const icon = makeElement("span", "learn-card__icon");
    const iconImage = makeElement("img", "asset-icon");
    iconImage.src = bin.icon;
    iconImage.alt = "";
    icon.append(iconImage);
    icon.setAttribute("aria-hidden", "true");
    const title = makeElement("span", "learn-card__title", bin.label);
    const description = makeElement(
      "span",
      "learn-card__description",
      bin.description,
    );
    const flipHint = makeElement(
      "span",
      "learn-card__hint",
      "↻ Tap to explore",
    );
    front.append(icon, title, description, flipHint);
    const back = makeElement("span", "learn-card__face learn-card__back");
    back.append(
      makeElement("span", "learn-card__back-title", `Goes in ${bin.label}`),
    );
    const list = makeElement("ul", "learn-card__examples");
    bin.examples.forEach((example) =>
      list.append(makeElement("li", "", example)),
    );
    back.append(
      list,
      makeElement("span", "learn-card__hint", "↻ Tap to flip back"),
    );
    inner.append(front, back);
    button.append(inner);
    article.append(button);
    host.append(article);
    button.addEventListener("click", () => {
      const opened = article.classList.toggle("is-flipped");
      button.setAttribute("aria-pressed", String(opened));
      state.viewedBins.add(bin.id);
      $("#cards-viewed").textContent =
        `${state.viewedBins.size} of ${courseData.bins.length} cards viewed`;
      $("#learn-next").disabled =
        state.viewedBins.size < courseData.bins.length;
    });
  });
};

const showResults = () => {
  const gameMax = courseData.items.length * 10;
  const quizMax = courseData.quiz.length * 10;
  const totalMax = [gameMax, quizMax].reduce((sum, score) => sum + score, 0);
  const earned = state.gameScore + state.quizScore;
  const percent = totalMax ? Math.round((earned / totalMax) * 100) : 0;
  const passed = percent >= courseData.course.passPercent;
  $("#results-title").textContent = `Well done, ${state.learnerName}!`;
  $("#results-message").textContent = passed
    ? "You passed. The pass mark is 70%."
    : "You scored below the 70% pass mark. Retry the quiz to improve.";
  $("#result-game").textContent = `${state.gameScore}/${gameMax}`;
  const headerScore = document.querySelector("#header-score");
  if (headerScore) headerScore.textContent = String(state.gameScore);
  $("#result-quiz").textContent = `${state.quizScore}/${quizMax}`;
  $("#result-percent").textContent = `${percent}%`;
  $("#result-status").textContent = passed ? "Passed" : "Pass mark 70%";
  $("#results-tip").textContent = passed
    ? "Great job! Keep sorting waste correctly."
    : "Retry the quiz to improve your score.";
  $(".result-stat--total").classList.toggle("is-pass", passed);
  showScreen("results");
};

const startCourse = () => {
  state.learnerName = $("#learner-name").value.trim();
  if (state.learnerName.length < 2) return;
  renderLearnCards();
  showScreen("learn");
};

const init = async () => {
  try {
    courseData = await loadCourse();
    document.title = courseData.course.title;
    // Keep the reference design's course eyebrow text unchanged.
    $("#course-intro").textContent = courseData.course.intro;
    $("#learner-name").addEventListener("input", (event) => {
      const valid = event.target.value.trim().length >= 2;
      $("#start-button").disabled = !valid;
      event.target.classList.toggle("is-valid", valid);
    });
    $("#welcome-form").addEventListener("submit", (event) => {
      event.preventDefault();
      startCourse();
    });
    $("#learn-next").addEventListener("click", () => {
      game = new SortingGame({
        data: courseData,
        state,
        tray: $("#item-tray"),
        binsHost: $("#game-bins"),
        scoreOutput: $("#game-score"),
        maxOutput: $("#game-max"),
        countOutput: $("#sort-count"),
        progress: $("#sort-progress"),
        feedback: $("#game-feedback"),
        continueButton: $("#game-continue"),
        instruction: $("#game-instruction"),
      });
      showScreen("game");
    });
    $("#game-continue").addEventListener("click", () => {
      quiz = new Quiz({
        questions: courseData.quiz,
        state,
        form: $("#quiz-form"),
        counter: $("#quiz-counter"),
        question: $("#quiz-question"),
        options: $("#quiz-options"),
        feedback: $("#quiz-feedback"),
        submit: $("#quiz-submit"),
        next: $("#quiz-next"),
        points: $("#quiz-points"),
      });
      state.onQuizComplete = showResults;
      showScreen("quiz");
    });
    $("#retry-quiz").addEventListener("click", () => {
      quiz.reset();
      showScreen("quiz");
    });
    $("#restart-course").addEventListener("click", () => {
      state.reset();
      $("#learner-name").value = "";
      $("#learner-name").classList.remove("is-valid");
      $("#start-button").disabled = true;
      $("#cards-viewed").textContent =
        `0 of ${courseData.bins.length} cards viewed`;
      $("#learn-next").disabled = true;
      $("#game-continue").hidden = true;
      $("#game-feedback").textContent = "";
      showScreen("welcome");
    });
    document.addEventListener("keydown", (event) => {
      if (
        state.currentScreen !== "game" ||
        !game ||
        !["1", "2", "3"].includes(event.key)
      )
        return;
      if (event.target.matches("input, textarea")) return;
      game.sortSelected(Number(event.key) - 1);
    });
  } catch (error) {
    const box = $("#app-error");
    box.hidden = false;
    box.textContent = `EcoSort couldn't start. ${error.message} Please run this folder through a local server (for example, VS Code Live Server) and check data/course.json.`;
    screens.forEach((screen) => {
      screen.hidden = true;
    });
  }
};

init();
