# 🤖 AI Content Generation with Groq API

Generate professional lesson content automatically using Groq's free API with Llama 3.1 70B model.

## Step 1: Get Free Groq API Key

1. Visit: **https://console.groq.com/keys**
2. Sign up with Google/GitHub (free)
3. Create a new API key
4. Copy the key (starts with `gsk_...`)

## Step 2: Set API Key

**On Mac/Linux:**
```bash
export GROQ_API_KEY='gsk_your_key_here'
```

**On Windows:**
```cmd
set GROQ_API_KEY=gsk_your_key_here
```

**Or add to your shell profile permanently:**
```bash
# Mac (add to ~/.zshrc or ~/.bash_profile)
echo 'export GROQ_API_KEY="gsk_your_key_here"' >> ~/.zshrc
source ~/.zshrc
```

## Step 3: Install Groq Python Package

```bash
pip install groq
```

## Step 4: Run Content Generator

```bash
cd /Users/baishalinisahu/Documents/arthrex-ai-platform1/api
python3 generate_content_groq.py
```

## What It Does

The script will:
1. ✅ Connect to your database
2. ✅ Show all courses with lesson counts
3. ✅ Let you choose which course to generate content for
4. ✅ Generate rich HTML content for each lesson using AI
5. ✅ Save content directly to database
6. ✅ Handle rate limits automatically (30 req/min free tier)
7. ✅ Skip lessons that already have content

## Content Generated

For **Video Lessons:**
- Introduction & overview
- 3-4 learning objectives
- Main content sections with examples
- Pro tips and best practices
- Summary recap

For **Labs/Projects:**
- Lab overview
- Prerequisites and tools
- Step-by-step instructions (5-7 steps)
- Expected outcomes
- Troubleshooting tips

For **Assignments:**
- Assignment objective
- Submission requirements
- Evaluation criteria
- Tips for success

For **Case Studies:**
- Real-world scenario
- Challenge description
- Solution approach
- Key takeaways

## Example Output

```bash
🤖 AI Content Generator - Using Groq API (Llama 3.1 70B)
======================================================================

📚 Found 9 courses in database

Select course to generate content:
  1. AI & ML Bootcamp - 7 weeks, 28 lessons
  2. Generative AI with Agents - 16 weeks, 68 lessons
  3. Enterprise AI Architect - 16 weeks, 72 lessons
  ...
  9. Enterprise AI Tools - 20 weeks, 80 lessons
  0. Generate for ALL courses

Enter choice (0-9): 9

🚀 Starting content generation...
   Model: Llama 3.1 70B (via Groq)
   Rate limit: 30 req/min, 6000 tokens/min

📖 Course: Enterprise AI Tools
----------------------------------------------------------------------

  📅 Week 1 — Introduction to Enterprise AI (6 hrs)
    🔄 Generating: 🎓 AI, ML, GenAI & Large Language Models (video)...
    ✅ Generated and saved (1847 chars)
    🔄 Generating: 🎓 Enterprise AI Use Cases: HR, Sales, Marketing, Finance (video)...
    ✅ Generated and saved (1923 chars)
    ...

======================================================================
📊 GENERATION SUMMARY
======================================================================
  Total lessons: 80
  ✅ Generated: 78
  ⏭️  Skipped (already had content): 2
  ❌ Errors: 0

🎉 Content generation complete!
```

## Rate Limits (Free Tier)

- **30 requests per minute**
- **6,000 tokens per minute**
- Script automatically waits 2 seconds between requests
- If rate limit hit, waits 20-60 seconds and retries

## Cost

**100% FREE** with Groq's free tier!
- No credit card required
- Unlimited use within rate limits
- Production-quality Llama 3.1 70B model

## Alternative: Use OpenAI

If you prefer OpenAI, use the original script:
```bash
python3 inject_full_curriculum.py
```

## Troubleshooting

### Error: "GROQ_API_KEY not set"
```bash
export GROQ_API_KEY='your-key-here'
```

### Error: "No module named 'groq'"
```bash
pip install groq
```

### Rate limit errors
- Script handles this automatically
- Waits and retries up to 3 times
- Consider running at off-peak hours for faster generation

### Content not showing in LMS
1. Restart Flask API: `pkill -f "python3 index.py" && python3 index.py`
2. Hard refresh browser: Cmd+Shift+R or Ctrl+Shift+F5

## Next Steps

After generating content:
1. Test in browser: http://localhost:8000/lms.html
2. Deploy to VPS using deploy script
3. Optionally regenerate specific lessons by deleting content first

---

**Model:** Llama 3.1 70B Versatile  
**Provider:** Groq (https://groq.com)  
**Free Tier:** Yes (30 req/min)  
**Quality:** Production-grade
