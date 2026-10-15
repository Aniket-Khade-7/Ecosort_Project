# EcoSort — Sort It Right!

A vanilla HTML5, CSS3 and JavaScript eLearning game for learners aged 10–14. Explore waste bins, sort household items, and complete a short multiple-choice quiz.

## Run locally

Because the app loads `data/course.json` with `fetch()`, do not open `index.html` directly as a `file://` URL.

**VS Code + Live Server**
1. Unzip the project and open the `ecosort` folder in VS Code.
2. Install/enable the Live Server extension if needed.
3. Right-click `index.html` and choose **Open with Live Server**.
4. The browser should open the EcoSort welcome screen.

Alternative: from the parent directory, run `python -m http.server 5500` and open `http://localhost:5500` (or `http://localhost:5500/ecosort/` if the server was started one directory above the project).

## Project structure

- `index.html` — semantic structure and the five single-page screens.
- `css/styles.css` — design system, responsive layouts and reduced-motion styles.
- `js/main.js` — app state, screen navigation, learn cards and results.
- `js/dataLoader.js` — asynchronous JSON loading and validation.
- `js/dragDrop.js` — mouse-event sorting game and keyboard alternative.
- `js/quiz.js` — shuffled MCQs, answer locking, feedback and scoring.
- `js/utils.js` — Fisher–Yates shuffle support utilities and animated number helper.
- `data/course.json` — all course copy, bin details, waste items, hints and quiz questions.

## Features and ES6+ usage

- ES modules: `type="module"` in HTML and imports/exports across JS files.
- `async`/`await`, `fetch()` and `try/catch`: JSON loading and friendly failure screen (`dataLoader.js`, `main.js`).
- `class`: `GameState`, `SortingGame` and `Quiz`.
- `const`, `let`, arrow functions, template literals, destructuring, spread syntax and array methods (`map`, `filter`/`find`, `forEach`, etc.).
- Fisher–Yates shuffle: quiz option order is randomized on each attempt while each option retains its original answer index.
- Mouse-based drag: `mousedown`, document-level `mousemove`/`mouseup`, `getBoundingClientRect()` hit testing, highlighted bins and listener cleanup. This does not use the HTML5 Drag and Drop API.
- Keyboard sorting: focus an unsorted item, press Enter/Space to select it, then press 1, 2 or 3 for a bin.
- Semantic HTML: header, nav, main, sections, articles, figure/figcaption in the visual design language, fieldset/legend, progress, output, live regions and native buttons.
- Responsive design: desktop layout and a 768px tablet layout with four item columns and a compact step indicator.
- Animations: card flip, screen transition, correct pulse, wrong-bin shake and animated progress, with `prefers-reduced-motion` support.

## Edit the content

Open `data/course.json` and edit the course, bins, items or quiz. Add more items or questions there; the scoring maximum is calculated from the JSON lengths. Keep `answerIndex` zero-based (the first option is `0`) and ensure each item's `bin` matches one of the three bin IDs. The three-bin design expects exactly three bins.

## Scoring

- Game: 10 points for a correct first attempt; 5 points if the item needed more than one try.
- Quiz: 10 points for each correct answer.
- Final percentage: total earned points divided by the maximum possible game + quiz points. Pass threshold comes from `course.passPercent`.
- Retry quiz resets quiz answers and quiz score only. Restart course resets the entire session and returns to Welcome.

## Known limitations

- Waste disposal rules vary by location; the sample content is educational and learners should follow local collection guidance.
- The required interaction uses mouse events; touch-specific Pointer Events are a possible enhancement. Keyboard sorting is provided.
- Google Fonts is optional styling; a system-font fallback is defined if it is unavailable.

## Suggested screenshots / walkthrough

Capture the Welcome, Learn, Sort Game (normal/correct/wrong), Quiz (unanswered/answered) and Results screens at 1280px and 768px. For the walkthrough, show the complete flow, change an item label or quiz question in `data/course.json`, refresh, and demonstrate the updated content.
