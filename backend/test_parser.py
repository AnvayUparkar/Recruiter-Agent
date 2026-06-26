import io
from services.resume_parser import ResumeParser

parser = ResumeParser()
test_text = "I am a software engineer proficient in C++, Java, Node.js, Next.js, HTML5, React, and Machine Learning. I have used Amazon Web Services."

# Fake a file stream just to pass to a method that extracts structured data from text
parsed = parser._extract_structured_data(test_text)
print("Skills detected:")
print(parsed.skills)
