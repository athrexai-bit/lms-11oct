#!/usr/bin/env python3
"""
Generate lesson content for all courses using Groq API (Llama 3 70B)
Free tier: 30 requests/minute, 6000 tokens/minute
"""

import os
import json
import sqlite3
import time
from groq import Groq

# Initialize Groq client
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')  # Set your API key
if not GROQ_API_KEY:
    print("⚠️  GROQ_API_KEY not set. Please set it:")
    print("   export GROQ_API_KEY='your-api-key-here'")
    print("\n   Get free API key at: https://console.groq.com/keys")
    exit(1)

client = Groq(api_key=GROQ_API_KEY)

DB_PATH = 'arthrex.db'

def get_lesson_prompt(lesson_title, lesson_type, duration, course_title, week_title):
    """Generate a prompt for creating lesson content"""
    
    if lesson_type == 'video':
        return f"""You are an expert instructional designer creating content for an online course.

Course: {course_title}
Week: {week_title}
Lesson: {lesson_title}
Type: Video lesson ({duration})

Create engaging lesson content in HTML format that includes:
1. A brief introduction (2-3 sentences explaining what this lesson covers)
2. 3-4 key learning objectives as bullet points
3. Main content sections with clear explanations (use <h3> for section headings)
4. Real-world examples or use cases
5. A "Pro Tip" or "Best Practice" callout box
6. A summary recap (2-3 sentences)

Use this HTML structure:
<div style="background:linear-gradient(135deg,#0739a822,#0b5fff11);border-left:4px solid #0b5fff;padding:16px 20px;border-radius:0 12px 12px 0;margin-bottom:20px">
  <p style="font-size:.95rem;line-height:1.7;color:var(--muted)">Introduction text here</p>
</div>

<h3 style="font-size:1.1rem;font-weight:700;margin:24px 0 12px;color:var(--ink)">📋 Learning Objectives</h3>
<ul style="margin-left:20px;color:var(--muted)">
  <li>Objective 1</li>
  <li>Objective 2</li>
</ul>

<h3 style="font-size:1.1rem;font-weight:700;margin:24px 0 12px;color:var(--ink)">Section Title</h3>
<p style="line-height:1.8;color:var(--muted);margin-bottom:16px">Content...</p>

<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0">
  <p style="font-weight:600;color:#92400e;margin-bottom:6px">💡 Pro Tip</p>
  <p style="color:#78350f;line-height:1.6;font-size:.9rem">Tip text here</p>
</div>

Write professional, clear, and actionable content. Be specific and practical."""

    elif lesson_type == 'project' or lesson_type == 'lab':
        return f"""You are an expert instructional designer creating hands-on lab content.

Course: {course_title}
Week: {week_title}
Lab: {lesson_title}
Duration: {duration}

Create practical lab instructions in HTML format that includes:
1. Lab overview (what you'll build)
2. Prerequisites and tools needed
3. Step-by-step instructions (5-7 clear steps)
4. Expected outcomes
5. Troubleshooting tips
6. Challenge extension (optional advanced task)

Use this HTML structure with colored sections and step numbers.
Make it practical, clear, and hands-on focused."""

    elif lesson_type == 'assignment':
        return f"""You are an expert instructional designer creating assignment content.

Course: {course_title}
Week: {week_title}
Assignment: {lesson_title}
Duration: {duration}

Create assignment instructions in HTML format that includes:
1. Assignment objective
2. What to submit
3. Evaluation criteria (3-4 points)
4. Submission format
5. Tips for success

Keep it clear and structured."""

    elif lesson_type == 'casestudy':
        return f"""You are an expert instructional designer creating case study content.

Course: {course_title}
Week: {week_title}
Case Study: {lesson_title}

Create case study content in HTML format that includes:
1. Real-world scenario description
2. The challenge or problem
3. The solution approach
4. Key takeaways (3-4 bullet points)
5. Discussion questions

Make it engaging and industry-relevant."""

    else:
        return f"""Create lesson content for: {lesson_title}
Course: {course_title}
Type: {lesson_type}

Provide structured, professional content in HTML format."""


def generate_content_with_groq(prompt, max_retries=3):
    """Generate content using Groq API with retry logic"""
    
    for attempt in range(max_retries):
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-70b-versatile",  # Free tier model
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert instructional designer creating high-quality online course content. Always respond with well-formatted HTML content."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000,
                top_p=1,
                stream=False
            )
            
            content = completion.choices[0].message.content
            return content.strip()
            
        except Exception as e:
            if 'rate_limit' in str(e).lower():
                wait_time = (attempt + 1) * 20  # 20, 40, 60 seconds
                print(f"   ⏳ Rate limit hit, waiting {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"   ❌ Error: {e}")
                return None
    
    return None


def get_courses_and_lessons():
    """Fetch all courses and their lessons from database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT course_id, data FROM lms")
    rows = cursor.fetchall()
    
    courses = []
    for row in rows:
        course_id = row[0]
        data = json.loads(row[1])
        courses.append({
            'id': course_id,
            'title': data.get('title', f'Course {course_id}'),
            'topics': data.get('topics', [])
        })
    
    conn.close()
    return courses


def update_lesson_content(course_id, topic_idx, lesson_idx, content):
    """Update a specific lesson's content in database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT data FROM lms WHERE course_id=?", (course_id,))
    row = cursor.fetchone()
    
    if row:
        data = json.loads(row[0])
        data['topics'][topic_idx]['lessons'][lesson_idx]['content'] = content
        
        cursor.execute(
            "UPDATE lms SET data=?, updated_at=CURRENT_TIMESTAMP WHERE course_id=?",
            (json.dumps(data), course_id)
        )
        conn.commit()
    
    conn.close()


def main():
    print("🤖 AI Content Generator - Using Groq API (Llama 3.1 70B)")
    print("=" * 70)
    print()
    
    # Check if API key is set
    if not GROQ_API_KEY:
        return
    
    courses = get_courses_and_lessons()
    
    print(f"📚 Found {len(courses)} courses in database")
    print()
    
    # Let user select which course to generate content for
    print("Select course to generate content:")
    for i, course in enumerate(courses, 1):
        lesson_count = sum(len(topic['lessons']) for topic in course['topics'])
        print(f"  {i}. {course['title']} - {len(course['topics'])} weeks, {lesson_count} lessons")
    
    print(f"  0. Generate for ALL courses")
    print()
    
    choice = input("Enter choice (0-{}): ".format(len(courses)))
    
    try:
        choice = int(choice)
    except:
        print("❌ Invalid choice")
        return
    
    if choice == 0:
        selected_courses = courses
    elif 1 <= choice <= len(courses):
        selected_courses = [courses[choice - 1]]
    else:
        print("❌ Invalid choice")
        return
    
    print()
    print("🚀 Starting content generation...")
    print("   Model: Llama 3.1 70B (via Groq)")
    print("   Rate limit: 30 req/min, 6000 tokens/min")
    print()
    
    total_lessons = 0
    generated_count = 0
    skipped_count = 0
    error_count = 0
    
    for course in selected_courses:
        print(f"\n📖 Course: {course['title']}")
        print("-" * 70)
        
        for topic_idx, topic in enumerate(course['topics']):
            week_title = topic.get('title', f"Week {topic_idx + 1}")
            print(f"\n  📅 {week_title}")
            
            for lesson_idx, lesson in enumerate(topic['lessons']):
                total_lessons += 1
                lesson_title = lesson.get('title', 'Untitled')
                lesson_type = lesson.get('type', 'video')
                duration = lesson.get('duration', '60m')
                
                # Skip if content already exists
                if lesson.get('content'):
                    print(f"    ⏭️  {lesson_title} - already has content")
                    skipped_count += 1
                    continue
                
                print(f"    🔄 Generating: {lesson_title} ({lesson_type})...")
                
                # Generate prompt
                prompt = get_lesson_prompt(
                    lesson_title, lesson_type, duration,
                    course['title'], week_title
                )
                
                # Generate content
                content = generate_content_with_groq(prompt)
                
                if content:
                    # Update database
                    update_lesson_content(course['id'], topic_idx, lesson_idx, content)
                    print(f"    ✅ Generated and saved ({len(content)} chars)")
                    generated_count += 1
                    
                    # Rate limiting: wait 2 seconds between requests
                    time.sleep(2)
                else:
                    print(f"    ❌ Failed to generate content")
                    error_count += 1
    
    print()
    print("=" * 70)
    print("📊 GENERATION SUMMARY")
    print("=" * 70)
    print(f"  Total lessons: {total_lessons}")
    print(f"  ✅ Generated: {generated_count}")
    print(f"  ⏭️  Skipped (already had content): {skipped_count}")
    print(f"  ❌ Errors: {error_count}")
    print()
    print("🎉 Content generation complete!")
    print()


if __name__ == '__main__':
    main()
