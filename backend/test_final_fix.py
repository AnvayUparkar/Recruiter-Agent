"""Final test to verify the complete fix for experience-based project detection."""

from services.resume_parser import ResumeParser

def test_complete_experience_project_detection():
    """Test comprehensive detection of projects in experience section."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("FINAL EXPERIENCE PROJECT DETECTION TEST")
    print("=" * 80)
    
    # Test the exact format from your screenshot
    test_text = """
EXPERIENCE

•Product Development Team-
– Developed a Student-Faculty Ratio Application under the guidance of the HOD to support faculty requirement analysis based on student intake.
Link - https://st-ds-product-dev.vercel.app/login
– Currently developing an application to track student participation in NGO events for Agastya, Akshaya Shakti Foundation, and participating colleges.

ABC Company Pvt Ltd – Software Developer - 2 Years
Mumbai, India
Jan 2022 - Present
• Developed web applications using React and Node.js
• Integrated APIs and databases
• Led team of 3 developers

EDUCATION
Bachelor of Technology in Computer Science
"""
    
    parsed = parser._extract_structured_data(test_text)
    
    print(f"RESULTS SUMMARY:")
    print(f"Experience entries: {len(parsed.experience)}")
    print(f"Projects detected: {len(parsed.projects)}")
    print()
    
    print("EXPERIENCE ANALYSIS:")
    for i, exp in enumerate(parsed.experience, 1):
        print(f"  {i}. Company: '{exp.get('company', 'N/A')}'")
        print(f"     Designation: '{exp.get('designation', 'N/A')}'")
        print(f"     Location: '{exp.get('location', 'N/A')}'")
        print(f"     Duration: '{exp.get('duration', 'N/A')}'")
        print(f"     Responsibilities: {len(exp.get('responsibilities', []))}")
        print()
    
    print("PROJECT ANALYSIS:")
    for i, proj in enumerate(parsed.projects, 1):
        print(f"  {i}. Title: '{proj.get('title', 'N/A')}'")
        print(f"     Link: '{proj.get('project_link', 'N/A')}'")
        print(f"     Context: '{proj.get('context', 'N/A')}'")
        print(f"     Description: {len(proj.get('description', []))} lines")
        print()
    
    print("VERIFICATION:")
    print("=" * 40)
    
    success_criteria = {
        'product_dev_team_found': False,
        'abc_company_found': False,
        'student_faculty_project': False,
        'ngo_project': False,
        'project_url_found': False
    }
    
    # Check experience entries
    for exp in parsed.experience:
        company = exp.get('company', '').lower()
        if 'product development team' in company:
            success_criteria['product_dev_team_found'] = True
        if 'abc company' in company or 'software developer' in company:
            success_criteria['abc_company_found'] = True
    
    # Check projects
    for proj in parsed.projects:
        title = proj.get('title', '').lower()
        link = proj.get('project_link', '')
        if 'student' in title and 'faculty' in title:
            success_criteria['student_faculty_project'] = True
        if 'ngo' in title or 'participation' in title or 'track' in title:
            success_criteria['ngo_project'] = True
        if 'vercel.app' in link:
            success_criteria['project_url_found'] = True
    
    # Print results
    for criterion, passed in success_criteria.items():
        status = "✓" if passed else "✗"
        print(f"{status} {criterion.replace('_', ' ').title()}")
    
    overall_success = all(success_criteria.values())
    
    print(f"\nOVERALL RESULT: {'🎉 SUCCESS' if overall_success else '❌ NEEDS WORK'}")
    
    if overall_success:
        print("\n✅ The parser now correctly handles projects in Experience sections!")
        print("✅ Project boundaries detected properly")
        print("✅ URLs extracted and preserved")
        print("✅ Company information parsed correctly")
    else:
        print(f"\n❌ Missing criteria: {[k for k, v in success_criteria.items() if not v]}")
    
    return overall_success

if __name__ == "__main__":
    print("Testing Complete Experience-Based Project Detection Fix\n")
    test_complete_experience_project_detection()