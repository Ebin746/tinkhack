export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    console.log("Received content for analysis:", content);

    const prompt = `
      Analyze the following code and extract the following details:
      - Classes and their relationships (e.g., inheritance, composition).
      - Methods within each class, including their parameters and return types.
      - Variables declared within methods, including their types.
      - Any relationships between classes, methods, and variables.
      - ONLY PROVIDE THE JSON RESPONSE AND NO EXPLANATION IS NEEDED.

      Output the result in the following JSON format:
      {
        "classes": [
          {
            "name": "ClassName",
            "methods": [
              {
                "name": "MethodName",
                "parameters": ["param1: Type", "param2: Type"],
                "returnType": "Type",
                "variables": ["var1: Type", "var2: Type"]
              }
            ],
            "inheritsFrom": "ParentClassName"
          }
        ],
        "relationships": [
          { "source": "ClassName", "target": "ParentClassName", "type": "inheritance" },
          { "source": "MethodName", "target": "VariableName", "type": "variable" }
        ]
      }

      Code:
      """
      ${content}
      """
    `;

    console.log("Generated prompt for Gemini:", prompt);

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    return NextResponse.json({ analysis: reply })
  } catch (error: any) {
    console.error("Error in Gemini analysis:", error.message, error.stack);
    return NextResponse.json(
      { error: error.message || "An error occurred while generating the response." },
      { status: 500 }
    );
  }
}