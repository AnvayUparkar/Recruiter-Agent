"""Test script for position/experience parsing issues."""

from services.resume_parser import ResumeParser

def test_position_parsing():
    """Test the specific position parsing issue from the screenshot."""
    parser = ResumeParser()
    
    print("=" * 80)
    print("POSITION PARSING TEST")
    print("=" * 80)
    print("Testing the specific position parsing issue where multiple positions are created incorrectly")
    print()
    
    # Recreate the format from your screenshot
    test_text = """
EXPERIENCE

Position

Worley Services Pvt. Ltd. — Technical Specialist 6.5 Years
6.5 years

• Led AWS cloud migration initiatives, improving scalability, availability, and cost efficiency.

Position

Developed Python-based solutions for secure data transfer.

• Designed integrations between ERM and EcoSys platforms for seamless data exchange using REST-based APIs and SOAP-based APIs.
• Worked in Agile teams to ensure timely delivery.

Position

Accenture Services Pvt. Ltd. — Associate Manager 12 Years
12.0 years

EDUCATION
Bachelor of Technology in Computer Science
"""
    
    parsed = parser._extract_structured_data(test_text)
    
    print(f"RESULTS:")
    print(f"Experience entries: {len(parsed.experience)}")
    print()
    
    print("EXPERIENCE ENTRIES:")
    for i, exp in enumerate(parsed.experience, 1):
        print(f"  {i}. Company: '{exp.get('company', 'N/A')}'")
        print(f"     Designation: '{exp.get('designation', 'N/A')}'")
        print(f"     Duration: '{exp.get('duration', 'N/A')}'")
        print(f"     Experience Years: {exp.get('experience_years', 0)}")
        print(f"     Location: '{exp.get('location', 'N/A')}'")
        print(f"     Responsibilities ({len(exp.get('responsibilities', []))} items):")
        for j, resp in enumerate(exp.get('responsibilities', [])[:3], 1):
            print(f"       {j}. {resp[:80]}...")
        if len(exp.get('responsibilities', [])) > 3:
            print(f"       ... and {len(exp.get('responsibilities', [])) - 3} more")
        print()
    
    print("ANALYSIS:")
    print("=" * 40)
    
    expected_companies = ["Worley Services Pvt. Ltd.", "Accenture Services Pvt. Ltd."]
    expected_positions = ["Technical Specialist", "Associate Manager"]
    expected_count = 2  # Should be 2 experience entries, not more
    
    # Check if we have the right number of entries
    count_correct = len(parsed.experience) == expected_count
    print(f"{'✓' if count_correct else '✗'} Experience count: Expected {expected_count}, Got {len(parsed.experience)}")
    
    # Check if companies are properly extracted
    found_companies = [exp.get('company', '') for exp in parsed.experience]
    worley_found = any('worley' in comp.lower() for comp in found_companies)
    accenture_found = any('accenture' in comp.lower() for comp in found_companies)
    
    print(f"{'✓' if worley_found else '✗'} Worley Services found: {worley_found}")
    print(f"{'✓' if accenture_found else '✗'} Accenture Services found: {accenture_found}")
    
    # Check if designations are properly extracted
    found_designations = [exp.get('designation', '') for exp in parsed.experience]
    tech_specialist_found = any('technical specialist' in desig.lower() for desig in found_designations)
    associate_manager_found = any('associate manager' in desig.lower() for desig in found_designations)
    
    print(f"{'✓' if tech_specialist_found else '✗'} Technical Specialist designation found: {tech_specialist_found}")
    print(f"{'✓' if associate_manager_found else '✗'} Associate Manager designation found: {associate_manager_found}")
    
    # Check if responsibilities are properly grouped
    worley_exp = None
    for exp in parsed.experience:
        if 'worley' in exp.get('company', '').lower():
            worley_exp = exp
            break
    
    if worley_exp:
        responsibilities = worley_exp.get('responsibilities', [])
        aws_found = any('aws' in resp.lower() for resp in responsibilities)
        python_found = any('python' in resp.lower() for resp in responsibilities)
        
        print(f"{'✓' if aws_found else '✗'} Worley has AWS responsibility: {aws_found}")
        print(f"{'✓' if python_found else '✗'} Worley has Python responsibility: {python_found}")
    else:
        print("✗ Worley experience entry not found for responsibility check")
    
    overall_success = (count_correct and worley_found and accenture_found and 
                      tech_specialist_found and associate_manager_found)
    
    print(f"\nOVERALL RESULT: {'🎉 SUCCESS' if overall_success else '❌ NEEDS FIXING'}")
    
    return overall_success

if __name__ == "__main__":
    print("Testing Position/Experience Parsing Issues\n")
    test_position_parsing()