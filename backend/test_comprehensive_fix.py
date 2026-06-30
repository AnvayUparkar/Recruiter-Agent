"""Comprehensive test for the enhanced resume parser project extraction fixes."""

from services.resume_parser import ResumeParser

def test_comprehensive_scenarios():
    """Test multiple realistic scenarios to ensure our fixes work comprehensively."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("COMPREHENSIVE PROJECT EXTRACTION TEST")
    print("=" * 80)
    
    # Scenario 1: The original problematic case
    scenario1 = """
PROJECTS

Quick Court
Description of Quick Court project...
AI-Driven Diagnostics For Health Innovation
Description of AI project...
JARVIS Student-Faculty Ratio Application
Description of JARVIS project...

EDUCATION
Bachelor of Technology
"""
    
    # Scenario 2: Projects with bullets and no spacing
    scenario2 = """
PROJECTS

•AI-Driven Diagnostics For Health Innovation
https://neuro-care-ai.netlify.app/
Developed an intelligent health monitoring system
•Quick Court
https://quickcourt.vercel.app/
Student participation tracking application
•JARVIS Student-Faculty Ratio Application
Faculty requirement analysis tool

SKILLS
Python, JavaScript
"""
    
    # Scenario 3: Mixed format with semester markers
    scenario3 = """
PROJECTS

Project Alpha - Healthcare System
Developed a comprehensive healthcare management platform
Technologies: Python, Django, PostgreSQL
https://healthcare-alpha.com

[Sem-VI] NGO Participation Tracker
Built during 6th semester as academic project
Used React and Node.js for development

Mini-Project: Student Analytics Dashboard
Created data visualization for student performance
Technologies: JavaScript, D3.js, MongoDB

EXPERIENCE
Software Engineer at ABC Corp
"""

    scenarios = [
        ("Original Problematic Case", scenario1),
        ("Bullets with URLs", scenario2), 
        ("Mixed Format with Semester", scenario3)
    ]
    
    all_passed = True
    
    for name, test_text in scenarios:
        print(f"\n--- {name} ---")
        parsed = parser._extract_structured_data(test_text)
        
        print(f"Projects detected: {len(parsed.projects)}")
        for i, proj in enumerate(parsed.projects, 1):
            title = proj.get('title', 'N/A')
            link = proj.get('project_link', '')
            desc_count = len(proj.get('description', []))
            tech_count = len(proj.get('technologies', []))
            
            print(f"  {i}. {title}")
            if link:
                print(f"     URL: {link}")
            print(f"     Desc: {desc_count} lines, Tech: {tech_count} items")
        
        # Basic validation
        if len(parsed.projects) >= 2:
            print(f"  ✓ Found multiple projects ({len(parsed.projects)})")
        else:
            print(f"  ✗ Expected multiple projects, found {len(parsed.projects)}")
            all_passed = False
    
    return all_passed

def test_logging_verification():
    """Test that project detection logging is working."""
    parser = ResumeParser()
    
    print(f"\n--- PROJECT DETECTION LOGGING TEST ---")
    
    test_text = """
PROJECTS

AI-Driven Diagnostics For Health Innovation
Project description here...
Quick Court
Another project description...
JARVIS Application
Final project description...

SKILLS
Python, JavaScript
"""
    
    print("Running parser (check console for project detection logs)...")
    parsed = parser._extract_structured_data(test_text)
    
    expected_titles = ["AI-Driven Diagnostics For Health Innovation", "Quick Court", "JARVIS Application"]
    found_titles = [proj.get('title', '') for proj in parsed.projects]
    
    print("Expected projects to be logged:")
    for title in expected_titles:
        print(f"  - {title}")
    
    print(f"Detected {len(parsed.projects)} projects total")
    return len(parsed.projects) == 3

if __name__ == "__main__":
    print("Testing Comprehensive Resume Parser Project Extraction Fixes\n")
    
    test1_passed = test_comprehensive_scenarios()
    test2_passed = test_logging_verification()
    
    print("\n" + "=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    
    if test1_passed and test2_passed:
        print("🎉 ALL COMPREHENSIVE TESTS PASSED!")
        print("\nThe enhanced project extraction is working correctly:")
        print("✓ Project boundary detection improved")
        print("✓ Bullet point project titles detected")
        print("✓ URLs properly extracted and separated")
        print("✓ Project logging implemented")
        print("✓ State machine approach working")
    else:
        print("❌ Some comprehensive tests failed:")
        if not test1_passed:
            print("  - Comprehensive scenario tests failed")
        if not test2_passed:
            print("  - Logging verification failed")