"""Debug URL extraction issue."""

from services.resume_parser import ResumeParser

def debug_url_extraction():
    """Debug URL extraction from projects."""
    parser = ResumeParser()
    
    test_text = """
PROJECTS

•AI-Driven Diagnostics For Health Innovation 
Description: Developed an innovative AI-based platform for early disease detection using machine learning algorithms.
Technologies: Python, TensorFlow, React.js, Node.js
Link: https://neuro-care-ai.netlify.app/

Quick Court
Description: A comprehensive court management system streamlining legal processes and case tracking.
Technologies: Java, Spring Boot, MySQL, Angular
"""
    
    print("DEBUG: URL Extraction")
    print("=" * 40)
    
    # Test URL extraction directly
    test_lines = [
        "Link: https://neuro-care-ai.netlify.app/",
        "https://neuro-care-ai.netlify.app/",
        "URL: https://neuro-care-ai.netlify.app/"
    ]
    
    for line in test_lines:
        extracted = parser._extract_project_url(line)
        print(f"Line: {repr(line)}")
        print(f"Extracted: {repr(extracted)}")
        print()
    
    # Parse projects
    sections = parser._intelligent_section_split(test_text)
    projects_text = sections.get("projects", "")
    
    print(f"Projects section found: {bool(projects_text)}")
    print(f"Projects text: {repr(projects_text)}")
    print()
    
    # Show individual lines being processed
    lines = [l.strip() for l in projects_text.split('\n') if l.strip()]
    print("Individual lines in projects text:")
    for i, line in enumerate(lines):
        url = parser._extract_project_url(line)
        print(f"  {i}: {repr(line)} -> URL: {repr(url)}")
    print()
    
    if projects_text:
        projects = parser._extract_structured_projects(projects_text)
        print(f"\nExtracted {len(projects)} projects:")
        
        for i, proj in enumerate(projects, 1):
            print(f"\n  Project {i}:")
            print(f"    Title: {repr(proj.get('title', ''))}")
            print(f"    Description: {repr(proj.get('description', ''))[:60]}...")
            print(f"    Link: {repr(proj.get('link', ''))}")
            print(f"    Technologies: {proj.get('technologies', [])}")

if __name__ == "__main__":
    debug_url_extraction()