import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = '/Users/baishalinisahu/Documents/arthrex-ai-platform1';
const skillDir = '/Users/baishalinisahu/.codex/plugins/cache/openai-primary-runtime/presentations/26.1007.11041/skills/presentations';
const buildDir = path.join(workspaceDir, '.codex-build', 'agi');
const finalPath = path.join(workspaceDir, 'output', 'intro-to-agi-case-study.pptx');
const stagingDir = path.join(workspaceDir, '.codex-finalizer');
const W = 1280, H = 720;
const C = { navy: '#081A3A', ink: '#10213D', blue: '#175BFF', cyan: '#1DC6D8', mint: '#BCF6D4', cream: '#F7F5EF', muted: '#57708F', line: '#D6E1EF', white: '#FFFFFF', amber: '#FFA84B', red: '#D65B63' };
const FONT = 'Aptos';

async function writeBlob(file, blob) { await fs.writeFile(file, new Uint8Array(await blob.arrayBuffer())); }
function box(slide, x, y, w, h, fill, radius = 'roundRect') {
  return slide.shapes.add({ geometry: radius, position: { left:x, top:y, width:w, height:h }, fill, line:{ style:'solid', fill, width:0 } });
}
function text(slide, value, x, y, w, h, size=20, color=C.ink, bold=false, align='left') {
  const s = slide.shapes.add({ geometry:'textbox', position:{left:x,top:y,width:w,height:h}, fill:'none', line:{style:'solid',fill:'none',width:0} });
  s.text = value;
  s.text.style = { fontFamily:FONT, fontSize:size, color, bold, paragraphAlignment:align, verticalAlignment:'middle', marginLeft:0, marginRight:0, marginTop:0, marginBottom:0 };
  return s;
}
function title(slide, n, value, subtitle) {
  text(slide, String(n).padStart(2,'0'), 76, 45, 54, 26, 13, C.cyan, true);
  text(slide, value, 76, 76, 920, 56, 34, C.ink, true);
  if (subtitle) text(slide, subtitle, 76, 138, 1000, 38, 17, C.muted);
  box(slide, 76, 182, 1128, 2, C.cyan, 'rect');
}
function footer(slide, n) { text(slide, `INTRODUCTION TO AGI   /   ${String(n).padStart(2,'0')}`, 76, 682, 330, 16, 10, C.muted, true); }
function note(slide, value) { slide.speakerNotes.text = value; slide.speakerNotes.setVisible(true); }
function pill(slide, label, x, y, w, fill, color=C.ink) { box(slide,x,y,w,34,fill); text(slide,label,x+14,y+5,w-28,24,14,color,true,'center'); }
function bullet(slide, lead, body, x, y, w, accent=C.blue) {
  box(slide, x, y+10, 10, 10, accent, 'ellipse');
  text(slide, lead, x+24, y, w-24, 26, 18, C.ink, true);
  text(slide, body, x+24, y+28, w-24, 45, 15, C.muted);
}

async function main() {
  await fs.mkdir(buildDir, { recursive:true });
  await fs.mkdir(path.dirname(finalPath), { recursive:true });
  await fs.mkdir(stagingDir, { recursive:true });
  const p = Presentation.create({ slideSize:{width:W,height:H} });

  // 1 cover
  { const s=p.slides.add(); s.background.fill=C.navy;
    text(s,'INTRODUCTION TO',76,78,350,28,15,C.cyan,true);
    text(s,'Artificial General\nIntelligence',76,126,650,164,53,C.white,true);
    text(s,'What AGI means, how it differs from today’s AI, and a practical case study',76,314,610,66,22,'#C8D9F3');
    pill(s,'A concise primer',76,418,190,'#163568',C.mint);
    // abstract but editable intelligence field
    for (let i=0;i<6;i++) { const size=62+i*30; const col=i%2 ? '#1452A3' : '#0F397A'; box(s,850-size/2,365-size/2,size,size,col,'ellipse'); }
    box(s,818,333,64,64,C.cyan,'ellipse'); text(s,'AGI',818,350,64,26,17,C.navy,true,'center');
    text(s,'Case study: hospital operations assistant',76,652,420,20,13,'#C8D9F3');
    note(s,'Opening: This deck uses AGI as a conceptual target, not a claim that it has already been achieved.');
  }

  // 2 definition
  { const s=p.slides.add(); s.background.fill=C.cream; title(s,2,'What does “AGI” mean?','A useful working definition focuses on breadth, adaptation, and independence.');
    text(s,'AGI describes a hypothetical AI system that can learn and apply knowledge across many domains at a level comparable to a capable human.',76,220,820,80,24,C.ink,true);
    const items=[['Broad competence','Works across unfamiliar tasks, not one narrow workflow.'],['Learning and transfer','Uses prior knowledge to solve a new problem with little extra training.'],['Reasoned action','Plans, uses tools, and checks its work against real constraints.']];
    items.forEach((it,i)=>{ const x=76+i*377; box(s,x,355,345,180,C.white); text(s,it[0],x+24,380,290,32,20,C.ink,true); text(s,it[1],x+24,430,290,68,16,C.muted); }); footer(s,2);
    note(s,'Definition note: There is no universally accepted test for AGI. Treat this as a practical framing for discussion.');
  }

  // 3 spectrum
  { const s=p.slides.add(); s.background.fill=C.white; title(s,3,'The AI capability spectrum','Today’s systems can be highly capable without meeting a broad AGI definition.');
    const stages=[['Narrow AI','Detects patterns in a defined task.','Spam filters\nImage classifiers'],['Generative AI','Creates and transforms content from prompts.','Chatbots\nCode assistants'],['Agentic AI','Pursues a goal through tools and multi-step workflows.','Research and operations agents'],['AGI','Generalizes across domains and adapts reliably to novelty.','Hypothetical']];
    stages.forEach((a,i)=>{ const x=76+i*284; box(s,x,265,250,250,i===3?'#E5FAFC':'#F5F8FC'); text(s,a[0],x+20,292,210,34,20,i===3?C.blue:C.ink,true); text(s,a[1],x+20,342,210,70,16,C.muted); text(s,a[2],x+20,445,210,45,14,i===3?C.blue:C.muted,true); if(i<3) text(s,'›',x+255,365,24,38,34,C.cyan,true,'center'); }); footer(s,3);
    note(s,'Speaker point: Agentic AI can execute multi-step tasks, but that alone does not establish general intelligence.');
  }

  // 4 capabilities
  { const s=p.slides.add(); s.background.fill=C.cream; title(s,4,'Capabilities an AGI system would need','The challenge is not just intelligence in isolation. It is dependable performance in changing environments.');
    const data=[['Understand context','Interpret goals, constraints, uncertainty, and social signals.'],['Learn continuously','Update knowledge without losing prior capabilities.'],['Transfer knowledge','Apply a method learned in one domain to another domain.'],['Plan and act','Break goals into steps, use tools, and recover from failure.'],['Explain decisions','Show sources, assumptions, and limits to a human reviewer.'],['Operate safely','Respect permissions, policies, and risk thresholds.']];
    data.forEach((a,i)=>{ const col=i%2,row=Math.floor(i/2), x=76+col*565,y=230+row*125; box(s,x,y,530,98,C.white); box(s,x+18,y+24,44,44,i%2?C.mint:'#DCE9FF','ellipse'); text(s,String(i+1),x+18,y+34,44,18,15,C.blue,true,'center'); text(s,a[0],x+82,y+18,400,28,19,C.ink,true); text(s,a[1],x+82,y+50,410,30,14,C.muted); }); footer(s,4);
    note(s,'This slide moves the conversation away from a single benchmark and toward reliable behavior in real workflows.');
  }

  // 5 opportunity / risk
  { const s=p.slides.add(); s.background.fill=C.white; title(s,5,'Why AGI matters','If systems become broadly capable, they could expand the range of work software can perform. The same capability raises the stakes for oversight.');
    text(s,'Potential value',76,230,430,35,22,C.blue,true); text(s,'Primary concerns',690,230,430,35,22,C.red,true);
    const left=[['Research','Explore hypotheses and synthesize evidence.'],['Operations','Coordinate complex work across systems and teams.'],['Access','Provide expert-level support in more languages and settings.']];
    const right=[['Reliability','Confident errors can cause real-world harm.'],['Control','A powerful system needs clear boundaries and human authority.'],['Equity','Access, bias, and accountability require deliberate design.']];
    left.forEach((a,i)=>bullet(s,a[0],a[1],76,290+i*105,470,C.cyan)); right.forEach((a,i)=>bullet(s,a[0],a[1],690,290+i*105,470,C.red)); footer(s,5);
    note(s,'Avoid claiming AGI will automatically create these outcomes. Benefits depend on product design, governance, and access.');
  }

  // 6 case study intro
  { const s=p.slides.add(); s.background.fill=C.navy; text(s,'CASE STUDY',76,63,180,24,14,C.cyan,true); text(s,'A hospital operations assistant',76,110,790,60,39,C.white,true); text(s,'Illustrative scenario: a health system uses an advanced AI assistant to reduce delays in patient discharge while clinical staff retain every final decision.',76,191,790,76,21,'#C8D9F3');
    const steps=[['1','Read','Bed status, orders, discharge notes, transport availability'],['2','Reason','Identify blockers and estimate which patients could leave safely'],['3','Coordinate','Draft task lists and route questions to the right teams'],['4','Escalate','Flag uncertainty, conflicting data, or high-risk cases']];
    steps.forEach((a,i)=>{ const y=330+i*72; box(s,76,y,54,54,i===3?'#FFB65F':'#163568','ellipse'); text(s,a[0],76,y+16,54,20,17,i===3?C.navy:C.cyan,true,'center'); text(s,a[1],154,y+2,130,26,18,C.white,true); text(s,a[2],287,y+2,740,44,15,'#C8D9F3'); });
    text(s,'Human control point: clinicians approve discharge decisions and the system cannot write orders.',76,648,950,23,14,C.mint,true); footer(s,6);
    note(s,'Case study is illustrative. It shows how broad reasoning could augment a complex workflow without giving the system autonomous clinical authority.');
  }

  // 7 case study workflow
  { const s=p.slides.add(); s.background.fill=C.cream; title(s,7,'Case study workflow and safeguards','The assistant acts as a coordinator. Clinical accountability remains with people.');
    const nodes=[['Data feeds','EHR, bed board, transport, staffing'],['AI assistant','Builds a shared view and identifies blockers'],['Human review','Nurse, physician, case manager validate the plan'],['Action','Teams complete tasks and update the record']];
    nodes.forEach((a,i)=>{ const x=76+i*282; box(s,x,290,235,162,i===1?'#E5FAFC':C.white); text(s,a[0],x+18,315,195,30,19,i===1?C.blue:C.ink,true,'center'); text(s,a[1],x+20,364,195,52,15,C.muted,false,'center'); if(i<3) text(s,'›',x+242,350,28,38,32,C.cyan,true,'center'); });
    text(s,'Guardrails',76,505,140,28,20,C.ink,true); pill(s,'Role-based access',230,498,190,'#DCE9FF'); pill(s,'Audit trail',438,498,145,'#DCE9FF'); pill(s,'Escalation rules',601,498,170,'#DCE9FF'); pill(s,'Human approval',789,498,170,'#DCE9FF'); footer(s,7);
    note(s,'The core design principle: match automation authority to risk. Lower-risk coordination can be more automated than clinical decisions.');
  }

  // 8 evaluation
  { const s=p.slides.add(); s.background.fill=C.white; title(s,8,'How to evaluate a system like this','A convincing demo is not enough. Teams need evidence that the system improves work without creating unacceptable risk.');
    const rows=[['Task quality','Does it identify the correct blocker and propose a workable next step?'],['Safety','Does it surface uncertainty and avoid unsupported recommendations?'],['Human workload','Does it reduce coordination burden without adding review overhead?'],['Fairness','Does performance stay consistent across patient groups and care settings?'],['Operational impact','Do discharge delays, rework, and escalations improve over time?']];
    rows.forEach((a,i)=>{ const y=225+i*78; box(s,76,y,1128,58,i%2?'#F4F8FD':'#FFFFFF','rect'); text(s,a[0],100,y+15,250,27,17,C.ink,true); text(s,a[1],387,y+13,750,30,15,C.muted); }); footer(s,8);
    note(s,'Use a staged rollout, a defined baseline, independent review, and clear stop conditions.');
  }

  // 9 close
  { const s=p.slides.add(); s.background.fill=C.navy; text(s,'KEY TAKEAWAYS',76,73,220,26,14,C.cyan,true); text(s,'AGI is a direction of travel,\nnot a product category today.',76,120,830,118,41,C.white,true);
    const facts=[['Definition','Broad, adaptive competence across domains.'],['Near-term focus','Build useful agents with limits, oversight, and evaluation.'],['Case-study lesson','Give AI coordination work first. Keep high-stakes decisions with accountable people.']];
    facts.forEach((a,i)=>{ const y=325+i*83; box(s,76,y,12,48,i===2?C.amber:C.cyan,'rect'); text(s,a[0],112,y,250,25,18,C.white,true); text(s,a[1],365,y,720,42,17,'#C8D9F3'); });
    text(s,'Discussion: Where would broader AI capability create value in your organization, and where must human authority remain?',76,606,1050,38,18,C.mint,true); footer(s,9);
    note(s,'Close with the discussion question. Avoid predicting a timeline for AGI; focus on responsible capability building now.');
  }

  const draftPath = path.join(buildDir, 'agi-intro-draft.pptx');
  await (await PresentationFile.exportPptx(p)).save(draftPath);
  for (const [i, slide] of p.slides.items.entries()) await writeBlob(path.join(buildDir, `slide-${String(i+1).padStart(2,'0')}.png`), await p.export({slide,format:'png',scale:1}));
  const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir,'container_tools','artifact_tool_utils.mjs')).href);
  const candidatePath = path.join(stagingDir,'agi-intro-candidate.pptx');
  await (await PresentationFile.exportPptx(p)).save(candidatePath);
  const result = await finalizePresentation({ workspaceDir, candidatePath, finalPath,
    pythonExecutable:'/Users/baishalinisahu/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
    integrityValidatorPath:path.join(skillDir,'container_tools','inspect_presentation_package_integrity.py'),
    layoutValidatorPath:path.join(skillDir,'container_tools','inspect_presentation_layout_geometry.py'),
    layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
    fontPolicy:{basis:'design',families:[FONT]}, verifyArtifactToolImport:true,
    receiptPath:path.join(stagingDir,'intro-to-agi-case-study.validation.json') });
  console.log(JSON.stringify({draftPath, finalPath, result},null,2));
}
main().catch(err=>{ console.error(err); process.exitCode=1; });
