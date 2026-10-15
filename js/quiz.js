import { shuffle } from "./utils.js";

export class Quiz {
  constructor({
    questions,
    state,
    form,
    counter,
    question,
    options,
    feedback,
    submit,
    next,
    points,
  }) {
    Object.assign(this, {
      questions,
      state,
      form,
      counter,
      question,
      options,
      feedback,
      submit,
      next,
      points,
    });
    this.currentIndex = 0;
    this.currentOptions = [];
    this.locked = false;
    this.renderQuestion();
    this.form.addEventListener("change", () => {
      if (!this.locked)
        this.submit.disabled = !this.options.querySelector("input:checked");
    });
    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.checkAnswer();
    });
    this.next.addEventListener("click", () => this.nextQuestion());
    this.options.addEventListener("change", (event) => {
      if (event.target.matches('input[type="radio"]'))
        this.submit.disabled = false;
    });
  }

  renderQuestion() {
    const q = this.questions[this.currentIndex];
    this.locked = false;
    this.currentOptions = shuffle(
      q.options.map((text, originalIndex) => ({ text, originalIndex })),
    );
    this.counter.textContent = `Question ${this.currentIndex + 1} of ${this.questions.length}`;
    this.question.textContent = q.question;
    this.points.textContent = "";
    this.options.replaceChildren();
    this.currentOptions.forEach(({ text, originalIndex }, index) => {
      const label = document.createElement("label");
      label.className = "quiz-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "quiz-answer";
      input.value = String(originalIndex);
      input.id = `answer-${this.currentIndex}-${index}`;
      const letter = document.createElement("span");
      letter.className = "quiz-option__letter";
      letter.textContent = String.fromCharCode(65 + index);
      const answer = document.createElement("span");
      answer.className = "quiz-option__text";
      answer.textContent = text;
      label.htmlFor = input.id;
      label.append(input, letter, answer);
      this.options.append(label);
    });
    this.feedback.textContent = "";
    this.feedback.className = "quiz-feedback";
    this.submit.disabled = true;
    this.submit.hidden = false;
    this.next.hidden = true;
    this.next.textContent =
      this.currentIndex === this.questions.length - 1
        ? "See results"
        : "Next question";
  }

  checkAnswer() {
    if (this.locked) return;
    const chosen = this.options.querySelector("input:checked");
    if (!chosen) return;
    this.locked = true;
    const q = this.questions[this.currentIndex];
    const correct = Number(chosen.value) === q.answerIndex;
    if (correct) this.state.quizScore += 10;
    this.options.querySelectorAll("input").forEach((input) => {
      input.disabled = true;
      const label = input.closest(".quiz-option");
      if (Number(input.value) === q.answerIndex)
        label.classList.add("is-correct");
      if (input.checked && !correct) label.classList.add("is-incorrect");
    });
    this.feedback.textContent = correct
      ? q.feedback.correct
      : q.feedback.incorrect;
    this.feedback.classList.add(
      correct ? "quiz-feedback--correct" : "quiz-feedback--incorrect",
    );
    this.submit.hidden = true;
    this.next.hidden = false;
    this.state.quizAnswered += 1;
  }

  nextQuestion() {
    if (!this.locked) return;
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex += 1;
      this.renderQuestion();
    } else {
      this.state.onQuizComplete();
    }
  }

  reset() {
    this.currentIndex = 0;
    this.state.quizScore = 0;
    this.state.quizAnswered = 0;
    this.renderQuestion();
  }
}
