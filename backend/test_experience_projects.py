"""Test script for detecting projects within the Experience section."""

from services.resume_parser import ResumeParser

def test_experience_section_projects():
    """Test projects listed in Experience section instead of Projects section."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("EXPERIENCE SECTION PROJECTS TEST")
    print("=" * 80)
    print("Testing projects listed under Experience instead of dedicated Projects section")
    print()
    
    # This matches your screenshot - projects listed under Experience
    test_text = """
EXPERIENCE

•Product Development Team-
– Developed a Student-Faculty Ratio Application under the guidance of the HOD to support faculty requirement analysis based on student intake.
Link - https://st-ds-product-dev.vercel.app/login
– Currently developing an application to track student participation in NGO events for Agastya, Akshaya Shakti Foundation, and participating colleges.

Previous Company Name
Software Developer - 2 Years
Mumbai, India
Jan 2022 - Present
• Developed web applications using React and Node.js
• Integrated APIs and databases

EDUCATION
Bachelor of Technology in Computer Science
"""
    
    parsed = parser._extract_structured_data(test_text)
    
    print(f"RESULTS:")
    print(f"Experience entries: {len(parsed.experience)}")
    print(f"Projects detected: {len(parsed.projects)}")
    print()
    
    print("EXPERIENCE ENTRIES:")
    for i, exp in enumerate(parsed.experience, 1):
        print(f"  {i}. Company: '{exp.get('company', 'N/A')}'")
        print(f"     Designation: '{exp.get('designation', 'N/A')}'")
        print(f"     Responsibilities ({len(exp.get('responsibilities', []))} items):")
        for j, resp in enumerate(exp.get('responsibilities', [])[:3], 1):
            print(f"       {j}. {resp[:100]}...")
        if len(exp.get('responsibilities', [])) > 3:
            print(f"       ... and {len(exp.get('responsibilities', [])) - 3} more")
        print()
    
    print("PROJECTS:")
    for i, proj in enumerate(parsed.projects, 1):
        print(f"  {i}. '{proj.get('title', 'N/A')}'")
        print(f"     Link: {proj.get('project_link', 'N/A')}")
    
    print("\nANALYSIS:")
    print("=" * 40)
    
    # Look for project indicators in experience
    found_student_faculty = False
    found_ngo_tracking = False
    found_project_links = False
    
    for exp in parsed.experience:
        responsibilities = exp.get('responsibilities', [])
        resp_text = ' '.join(responsibilities).lower()
        
        if 'student-faculty ratio application' in resp_text:
            found_student_faculty = True
            print("✓ Found Student-Faculty Ratio Application in experience")
        
        if 'ngo events' in resp_text or 'agastya' in resp_text:
            found_ngo_tracking = True  
            print("✓ Found NGO tracking application in experience")
            
        if any('vercel.app' in resp for resp in responsibilities):
            found_project_links = True
            print("✓ Found project link in experience")
    
    if not found_student_faculty:
        print("✗ Student-Faculty Ratio Application not found in experience")
    if not found_ngo_tracking:
        print("✗ NGO tracking application not found in experience")
    if not found_project_links:
        print("✗ Project links not found in experience")
    
    # Check if "Product Development Team-" is parsed correctly
    product_dev_found = False
    for exp in parsed.experience:
        if 'product development team' in exp.get('company', '').lower():
            product_dev_found = True
            print("✓ 'Product Development Team-' detected as company")
            break
    
    if not product_dev_found:
        print("✗ 'Product Development Team-' not properly detected")
    
    return found_student_faculty and found_ngo_tracking and product_dev_found

def test_ideal_behavior():
    """Test what the ideal behavior should be - extracting projects from experience."""
    print("\n" + "=" * 80)
    print("IDEAL BEHAVIOR RECOMMENDATION")
    print("=" * 80)
    
    print("""
CURRENT BEHAVIOR:
- Projects in Experience section are treated as experience responsibilities
- Project links get lost in responsibility text
- Project names don't get extracted as separate entities

RECOMMENDED IMPROVEMENT:
- Detect project-like patterns in Experience responsibilities
- Extract them as separate project entities
- Preserve both experience context AND project details

EXAMPLE EXTRACTION:
Experience:
  Company: Product Development Team
  Responsibilities: [list of non-project tasks]
  
Projects: 
  1. Student-Faculty Ratio Application
     Link: https://st-ds-product-dev.vercel.app/login
     Context: Developed under Product Development Team role
  
  2. NGO Participation Tracking Application  
     Description: Track student participation in NGO events for Agastya, Akshaya Shakti Foundation
     Context: Currently developing under Product Development Team role
""")

if __name__ == "__main__":
    print("Testing Experience Section Project Detection\n")
    
    success = test_experience_section_projects()
    test_ideal_behavior()
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    if success:
        print("✓ Experience parsing is working, but projects could be better extracted")
    else:
        print("✗ Experience parsing needs improvement for project detection")
    
    print("\nNEXT STEPS:")
    print("1. Add project extraction from experience responsibilities")  
    print("2. Preserve project links that appear in experience")
    print("3. Create hybrid entries (both experience AND project)")
    print("4. Maintain backward compatibility with current parsing")