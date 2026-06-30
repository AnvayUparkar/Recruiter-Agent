"""Debug script to analyze the specific project parsing issue from the screenshot."""

from services.resume_parser import ResumeParser

def debug_health_project_parsing():
    """Debug the specific health innovation project parsing issue."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("DEBUGGING HEALTH INNOVATION PROJECT PARSING")
    print("=" * 80)
    
    # Recreate the text structure from the screenshot
    test_text = """
PROJECTS

AI-Driven Diagnostics For Health Innovation [Mini-Project] - (Completed) - [Sem-VI]
https://neuro-care-ai.netlify.app/

AI-powered platform for real-time disease prediction (lung cancer, diabetes, heart) using Machine Learning, combined with a smart diet planner and explainable insights for proactive healthcare decisions. Integrates Generative AI clinical guidance and decision support.OCR-based report analysis for extracting biomarkers (HbA1c, lipid profile)

Activity-based diet recommendations using Google Fit / Health Connect and Gesture-based SOS emergency system with live routing and alerts using OpenCV
Uses Nominatim + Leaflet with OpenStreetMap for location tracking & hospital navigation

Technologies: Artificial Intelligence, Generative AI

Other Project Name
Description of other project here

EDUCATION
Bachelor of Technology
"""
    
    print("INPUT TEXT:")
    print("-" * 40)
    print(test_text)
    print("-" * 40)
    
    parsed = parser._extract_structured_data(test_text)
    
    print(f"\nRESULTS:")
    print(f"Total projects detected: {len(parsed.projects)}")
    print()
    
    for i, proj in enumerate(parsed.projects, 1):
        print(f"PROJECT {i}:")
        print(f"  Title: '{proj.get('title', 'N/A')}'")
        print(f"  Link: {proj.get('project_link', 'N/A')}")
        
        desc = proj.get('description', [])
        if isinstance(desc, list):
            print(f"  Description ({len(desc)} lines):")
            for j, line in enumerate(desc[:5], 1):  # Show first 5 lines
                print(f"    {j}. {line}")
            if len(desc) > 5:
                print(f"    ... and {len(desc) - 5} more lines")
        
        techs = proj.get('technologies', [])
        print(f"  Technologies ({len(techs)}): {', '.join(techs)}")
        print()
    
    print("ANALYSIS:")
    print("=" * 40)
    
    # Check if the "Activity-based diet recommendations" is being treated as separate
    found_activity_project = False
    for proj in parsed.projects:
        title = proj.get('title', '').lower()
        desc_text = ' '.join(proj.get('description', [])).lower()
        
        if 'activity-based diet' in title or 'activity-based diet' in desc_text:
            if 'activity-based diet' in title:
                print("✓ 'Activity-based diet recommendations' detected as separate project title")
                found_activity_project = True
            else:
                print("✗ 'Activity-based diet recommendations' found in description, should be separate project")
    
    if not found_activity_project:
        print("✗ 'Activity-based diet recommendations' not found as separate project")
    
    # Check main project
    main_project = None
    for proj in parsed.projects:
        if 'ai-driven diagnostics' in proj.get('title', '').lower():
            main_project = proj
            break
    
    if main_project:
        desc_lines = main_project.get('description', [])
        if len(desc_lines) > 3:
            print(f"⚠️  Main project has {len(desc_lines)} description lines - might be merging multiple projects")
        else:
            print("✓ Main project has reasonable description length")
    
    return parsed.projects

if __name__ == "__main__":
    projects = debug_health_project_parsing()