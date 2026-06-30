"""Quick test for the project parsing portion only."""

from services.resume_parser import ResumeParser

parser = ResumeParser()

# Test the advanced project parsing that was failing
print("=" * 80)
print("TEST: Advanced Project Parsing - Multiple Projects with Boundaries")
print("=" * 80)

advanced_project_text = """
PROJECTS

AI-Driven Diagnostics For Health Innovation
Developed an intelligent health monitoring system using computer vision
• Implemented real-time health parameter detection
• Built predictive analytics using machine learning algorithms
• Created alerts using OpenCV and image processing
Technologies: Artificial Intelligence, Generative AI, OpenCV, Python, Machine Learning

JARVIS
https://github.com/user/jarvis
Developed a personal AI assistant with voice recognition
• Integrated Gemini API for natural language processing
• Built OCR functionality for document scanning
• Implemented RAG (Retrieval Augmented Generation)
Technologies: Python, Gemini API, OCR, RAG, Natural Language Processing

Quick Court - Gujarat, Gandhinagar
Link: https://quickcourt.vercel.app/
Currently developing an application to track student participation in NGO events
• Built Flask backend with user authentication
• Implemented real-time notifications
• Created dashboard for event management
Technologies: Flask, React, Node.js, MongoDB, JavaScript

Student-Faculty Ratio Application
Developed under the guidance of the HOD to support faculty requirement analysis
• Built data visualization components
• Integrated with university database systems
• Created automated reporting features
Technologies: Django, PostgreSQL, Python, Data Visualization

EDUCATION

Bachelor of Technology - Computer Science
"""

parsed_advanced = parser._extract_structured_data(advanced_project_text)
print(f"Total projects detected: {len(parsed_advanced.projects)}")
print()

for i, proj in enumerate(parsed_advanced.projects, 1):
    print(f"PROJECT {i}:")
    print(f"  Title: {proj.get('title', 'N/A')}")
    print(f"  Link: {proj.get('project_link', 'N/A')}")
    
    # Show description as array (bullet points)
    desc = proj.get('description', [])
    if isinstance(desc, list) and desc:
        print(f"  Description ({len(desc)} points):")
        for j, point in enumerate(desc[:3], 1):  # Show first 3 points
            print(f"    {j}. {point}")
        if len(desc) > 3:
            print(f"    ... and {len(desc) - 3} more")
    elif desc:
        print(f"  Description: {str(desc)[:100]}...")
    else:
        print("  Description: N/A")
    
    techs = proj.get('technologies', [])
    print(f"  Technologies ({len(techs)}): {', '.join(techs[:5])}")
    if len(techs) > 5:
        print(f"    ... and {len(techs) - 5} more")
    
    print()

print("Test completed successfully!")