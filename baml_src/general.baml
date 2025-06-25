
// Defining a data model.
class Answer {
  answer string
}

// Create a function to extract the resume from a string.
function GeneralQuestion(question: string) -> Answer {
  client "ollama/deepseek-r1:1.5b"
  prompt #"
    {{ question }}
    {{ ctx.output_format }}
  "#
}
