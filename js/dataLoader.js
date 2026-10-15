export const loadCourse = async () => {
  const response = await fetch('./data/course.json');
  if (!response.ok) throw new Error(`Could not load course data (HTTP ${response.status}).`);
  const data = await response.json();
  if (!data.course || !Array.isArray(data.bins) || !Array.isArray(data.items) || !Array.isArray(data.quiz)) {
    throw new Error('The course data file is missing a required section. Please check data/course.json.');
  }
  if (data.bins.length !== 3) throw new Error('The course data must contain exactly three bins.');
  return data;
};
