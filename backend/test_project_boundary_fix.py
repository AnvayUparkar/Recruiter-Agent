"""Test script for the enhanced project boundary detection fix."""

import io
from services.resume_parser import ResumeParser

def test_project_boundary_detection():
    """Test the specific issue mentioned: AI-Driven Diagnostics being merged with Quick Court."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("PROJECT BOUNDARY DETECTION TEST")
    print("=" * 80)
    print("Testing the specific issue: 'AI-Driven Diagnostics For Health Innovation' merging with 'Quick Court'")
    print()
    
    # This is the problematic case - no blank lines between projects
    test_text = """
PROJECTS

Quick Court
Currently developing an application to track student participation in NGO events.
Built using Flask backend with user authentication and real-time notifications.
https://quickcourt.vercel.app/
•AI-Driven Diagnostics For Health Innovation
Developed an intelligent health monitoring system using computer vision technology.
Implemented real-time health parameter detection and predictive analytics.
https://neuro-care-ai.netlify.app/
•JARVIS Student-Faculty Ratio Application
Built under HOD guidance for faculty requirement analysis and automated reporting.
Technologies: Python, Django, PostgreSQL, Data Visualization

EDUCATION
Bachelor of Technology in Computer Science
"""
    
    parsed = parser._extract_structured_data(test_text)
    
    print(f"RESULTS:")
    print(f"Total projects detected: {len(parsed.projects)}")
    print()
    
    expected_projects = [
        "Quick Court",
        "AI-Driven Diagnostics For Health Innovation", 
        "JARVIS Student-Faculty Ratio Application"
    ]
    
    for i, proj in enumerate(parsed.projects, 1):
        print(f"PROJECT {i}:")
        print(f"  Title: '{proj.get('title', 'N/A')}'")
        print(f"  Link: {proj.get('project_link', 'N/A')}")
        
        desc = proj.get('description', [])
        if isinstance(desc, list):
            print(f"  Description ({len(desc)} lines):")
            for line in desc[:2]:  # Show first 2 lines
                print(f"    - {line}")
            if len(desc) > 2:
                print(f"    ... and {len(desc) - 2} more lines")
        
        techs = proj.get('technologies', [])
        if techs:
            print(f"  Technologies: {', '.join(techs)}")
        print()
    
    # VERIFICATION
    print("VERIFICATION:")
    print("=" * 40)
    
    success = True
    found_titles = [proj.get('title', '') for proj in parsed.projects]
    
    # Check we have the right number of projects
    if len(parsed.projects) == 3:
        print("✓ Correct number of projects detected (3)")
    else:
        print(f"✗ Expected 3 projects, found {len(parsed.projects)}")
        success = False
    
    # Check each expected project is found
    for expected in expected_projects:
        found = False
        for title in found_titles:
            if expected.lower() in title.lower():
                found = True
                break
        
        if found:
            print(f"✓ Found: '{expected}'")
        else:
            print(f"✗ Missing: '{expected}'")
            success = False
    
    # Check that AI-Driven Diagnostics is NOT merged with Quick Court
    ai_project = None
    quick_court_project = None
    
    for proj in parsed.projects:
        title = proj.get('title', '').lower()
        if 'ai-driven diagnostics' in title:
            ai_project = proj
        elif 'quick court' in title:
            quick_court_project = proj
    
    if ai_project and quick_court_project:
        print("✓ AI-Driven Diagnostics and Quick Court are separate projects")
        
        # Check that AI project has its own URL
        ai_link = ai_project.get('project_link', '')
        if 'neuro-care-ai.netlify.app' in ai_link:
            print("✓ AI-Driven Diagnostics has correct URL")
        else:
            print(f"✗ AI-Driven Diagnostics missing correct URL: {ai_link}")
            success = False
            
        # Check that Quick Court has its own URL
        qc_link = quick_court_project.get('project_link', '')
        if 'quickcourt.vercel.app' in qc_link:
            print("✓ Quick Court has correct URL")
        else:
            print(f"✗ Quick Court missing correct URL: {qc_link}")
            success = False
            
    else:
        print("✗ AI-Driven Diagnostics and Quick Court not found as separate projects")
        success = False
    
    print()
    if success:
        print("🎉 ALL TESTS PASSED! The project boundary detection fix is working correctly.")
    else:
        print("❌ Some tests failed. The fix needs more work.")
    
    return success

def test_bullet_project_detection():
    """Test detection of projects that start with bullets."""
    parser = ResumeParser()
    
    print("\n" + "=" * 80)
    print("BULLET PROJECT DETECTION TEST")
    print("=" * 80)
    
    test_text = """
PROJECTS

•AI-Driven Diagnostics For Health Innovation
Developed intelligent health monitoring system
•Quick Court
Student participation tracking application
•JARVIS Student-Faculty Ratio Application
Faculty requirement analysis tool
[Sem-VI] NGO Participation Tracker
Semester project for tracking NGO events

SKILLS
Python, JavaScript, React
"""
    
    parsed = parser._extract_structured_data(test_text)
    
    print(f"Projects detected: {len(parsed.projects)}")
    
    expected_bullets = [
        "AI-Driven Diagnostics For Health Innovation",
        "Quick Court", 
        "JARVIS Student-Faculty Ratio Application",
        "NGO Participation Tracker"
    ]
    
    for i, proj in enumerate(parsed.projects, 1):
        print(f"{i}. {proj.get('title', 'N/A')}")
    
    print(f"\nExpected {len(expected_bullets)} projects, found {len(parsed.projects)}")
    
    success = len(parsed.projects) == len(expected_bullets)
    for expected in expected_bullets:
        found = any(expected.lower() in proj.get('title', '').lower() for proj in parsed.projects)
        print(f"{'✓' if found else '✗'} {expected}")
        if not found:
            success = False
    
    return success

if __name__ == "__main__":
    print("Testing Enhanced Project Boundary Detection\n")
    
    test1_success = test_project_boundary_detection()
    test2_success = test_bullet_project_detection()
    
    print("\n" + "=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    
    if test1_success and test2_success:
        print("🎉 ALL TESTS PASSED! The project extraction fix is working correctly.")
    else:
        print("❌ Some tests failed:")
        if not test1_success:
            print("  - Project boundary detection needs work")
        if not test2_success:
            print("  - Bullet project detection needs work")