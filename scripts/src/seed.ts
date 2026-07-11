import { eq } from "drizzle-orm";
import {
  db,
  contentTypesTable,
  textsTable,
  documentsTable,
  documentTextsTable,
  documentVersionsTable,
  metalanguageTermsTable,
  pool,
} from "@workspace/db";

// Seeds a small set of REPRESENTATIVE SAMPLE content, not Pamina's real
// library (which doesn't exist in this repo yet). It exists so every content
// type template, the curriculum mapping tool, and the CMS can be exercised
// end-to-end. Replace/expand via the CMS once the real library is ready.

async function upsertContentType(slug: string, name: string, description: string) {
  const [existing] = await db
    .select()
    .from(contentTypesTable)
    .where(eq(contentTypesTable.slug, slug));
  if (existing) return existing;
  const [created] = await db
    .insert(contentTypesTable)
    .values({ slug, name, description })
    .returning();
  return created;
}

async function upsertText(
  title: string,
  author: string,
  yearLevels: number[],
  courseTypes: string[],
) {
  const [existing] = await db
    .select()
    .from(textsTable)
    .where(eq(textsTable.title, title));
  if (existing) return existing;
  const [created] = await db
    .insert(textsTable)
    .values({ title, author, yearLevels, courseTypes })
    .returning();
  return created;
}

async function upsertDocument(params: {
  title: string;
  slug: string;
  contentTypeId: number;
  body: string;
  yearLevels: number[];
  courseTypes: string[];
  taskTypes: string[];
  textIds: number[];
}) {
  const [existing] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.slug, params.slug));
  if (existing) return existing;

  const [doc] = await db
    .insert(documentsTable)
    .values({
      title: params.title,
      slug: params.slug,
      contentTypeId: params.contentTypeId,
      body: params.body,
      yearLevels: params.yearLevels,
      courseTypes: params.courseTypes,
      taskTypes: params.taskTypes,
      status: "published",
      publishedAt: new Date(),
    })
    .returning();

  if (params.textIds.length > 0) {
    await db
      .insert(documentTextsTable)
      .values(params.textIds.map((textId) => ({ documentId: doc.id, textId })));
  }

  await db.insert(documentVersionsTable).values({
    documentId: doc.id,
    versionNumber: 1,
    body: params.body,
  });

  return doc;
}

async function upsertTerm(
  term: string,
  definition: string,
  tab: string,
  example: string | null,
) {
  const [existing] = await db
    .select()
    .from(metalanguageTermsTable)
    .where(eq(metalanguageTermsTable.term, term));
  if (existing) return existing;
  const [created] = await db
    .insert(metalanguageTermsTable)
    .values({ term, definition, tab, example })
    .returning();
  return created;
}

async function main() {
  const paragraphStructure = await upsertContentType(
    "paragraph-structure",
    "Literature ATAR Paragraph Structure",
    "Nine-sentence analytical paragraph framework, text-specific, with worked examples and annotations.",
  );
  const introductionStructure = await upsertContentType(
    "introduction-structure",
    "Literature ATAR Introduction Structure",
    "Six-part introduction framework, transferable to all texts.",
  );
  const bVsA = await upsertContentType(
    "b-vs-a-comparison",
    "B vs A Comparison",
    "Sentence-by-sentence comparison of B-range and A-range analytical writing, annotated to name exactly where the gap is.",
  );
  const closeReading = await upsertContentType(
    "close-reading-suite",
    "Close Reading Teaching Suite",
    "Teaching note plus B vs A comparison for an unseen text, built around the dominant reading framework.",
  );
  await upsertContentType(
    "cultural-context-library",
    "Cultural Context Library",
    "Six-hub architecture mapping literature from different countries and cultures to the empowered/disempowered analytical framework.",
  );
  const dollsHouse = await upsertText("A Doll's House", "Henrik Ibsen", [11], [
    "literature_atar",
  ]);
  const frankenstein = await upsertText("Frankenstein", "Mary Shelley", [11], [
    "literature_atar",
  ]);
  const godOfSmallThings = await upsertText(
    "The God of Small Things",
    "Arundhati Roy",
    [12],
    ["literature_atar"],
  );
  const ghostCities = await upsertText("Ghost Cities", "Siang Lu", [11, 12], [
    "literature_atar",
    "english_atar",
  ]);

  await upsertDocument({
    title: "Nine-Sentence Paragraph Structure — [[A Doll's House]]",
    slug: "nine-sentence-paragraph-structure-a-dolls-house",
    contentTypeId: paragraphStructure.id,
    yearLevels: [11],
    courseTypes: ["literature_atar"],
    taskTypes: ["essay"],
    textIds: [dollsHouse.id],
    body: `# Nine-Sentence Paragraph Structure — [[A Doll's House]]

This framework builds a complete analytical paragraph in nine sentences: a claim, three
pieces of evidence each unpacked with technique and effect, and a link back to the
question. It transfers to any text — [[A Doll's House]] is this worked example.

:::term Dramatic Irony
The audience knows something a character does not, creating tension between what is
said and what is understood. In [[A Doll's House]], the audience recognises Nora's
performed contentment as a mask long before Torvald does.
:::

**Sentence 1 — Claim.** Ibsen constructs Nora's domestic performance as a survival
strategy rather than genuine contentment, exposing the fragility of a marriage built on
concealment.

**Sentences 2–4 — First evidence and unpacking.** Nora's private consumption of
macaroons, hidden from Torvald, dramatises a small but pointed act of autonomy...

:::model
Ibsen's use of dramatic irony in the macaroon motif underscores the gap between Nora's
performed obedience and her private assertions of self, positioning the audience to
read her domesticity as rehearsed rather than natural.
:::

**Sentences 5–9** continue this pattern with two further pieces of evidence before
linking back to the question. (Sample content — replace with the full worked
document via the CMS.)`,
  });

  await upsertDocument({
    title: "B vs A Comparison — [[Frankenstein]]",
    slug: "b-vs-a-comparison-frankenstein",
    contentTypeId: bVsA.id,
    yearLevels: [11],
    courseTypes: ["literature_atar"],
    taskTypes: ["essay"],
    textIds: [frankenstein.id],
    body: `# B vs A Comparison — [[Frankenstein]]

Sentence-by-sentence comparison naming exactly where a B-range response falls short
of an A-range response on the same idea.

:::term Juxtaposition
Placing two contrasting ideas or images side by side to sharpen the reader's sense of
the contrast. Shelley juxtaposes the sublime Arctic landscape with Victor's moral
corruption throughout [[Frankenstein]].
:::

**B-range:** "Shelley uses juxtaposition to show that Victor is different from nature."
— *Names the technique but does not explain the effect on meaning; "different from" is
vague.*

**A-range:**

:::model
Shelley's juxtaposition of the sublime, indifferent Arctic wilderness against Victor's
feverish self-justification underscores the smallness of human transgression against
the scale of the natural world, framing his guilt as inescapable rather than merely
regrettable.
:::

*The A-range response names the technique, locates it precisely, and explains what it
does to meaning — this is the gap the B-range response is missing.*

(Sample content — replace with the full seven-document B vs A set via the CMS.)`,
  });

  await upsertDocument({
    title: "Close Reading Teaching Suite — [[Ghost Cities]]",
    slug: "close-reading-teaching-suite-ghost-cities",
    contentTypeId: closeReading.id,
    yearLevels: [11, 12],
    courseTypes: ["literature_atar", "english_atar"],
    taskTypes: ["close_reading"],
    textIds: [ghostCities.id],
    body: `# Close Reading Teaching Suite — [[Ghost Cities]]

An unseen text close reading suite built around the dominant reading framework: what
is the text most insistently asking you to notice, and how does form serve that?

:::term Dominant Reading
The interpretation a text's structure and technique most strongly invite, as opposed to
alternative or resistant readings. Establishing the dominant reading first gives a close
reading response its organising spine.
:::

**Teaching note.** Begin by identifying the dominant reading in one sentence before
selecting evidence — students who search for techniques before committing to a
reading tend to produce disconnected technique-spotting rather than argument.

:::model
Lu's fragmented narrative structure in [[Ghost Cities]] positions displacement not as a
single event but as a recurring condition, so that the dominant reading turns on
discontinuity itself rather than on any one character's journey.
:::

(Sample content — replace with the full teaching suite via the CMS.)`,
  });

  const diagnosticFeedback = await upsertContentType(
    "diagnostic-feedback",
    "Student Diagnostic Feedback",
    "Text-specific diagnostic assessment of a student essay with a model paragraph rewrite and annotated teaching notes.",
  );

  await upsertDocument({
    title: "Diagnostic Feedback — [[The God of Small Things]] Essay",
    slug: "diagnostic-feedback-god-of-small-things",
    contentTypeId: diagnosticFeedback.id,
    yearLevels: [12],
    courseTypes: ["literature_atar"],
    taskTypes: ["essay"],
    textIds: [godOfSmallThings.id],
    body: `# Diagnostic Feedback — [[The God of Small Things]] Essay

Delivered via the Google Drive pipeline in the full build: Pamina annotates a
student's own document directly, and the AI reads both the original work and her
interventions together. This sample shows the document shape that pipeline produces.

:::term Non-Linear Narrative
A narrative structure that does not follow chronological order, instead moving between
past and present. Roy's fractured timeline in [[The God of Small Things]] mirrors the
way trauma resurfaces out of sequence for Rahel and Estha.
:::

**Diagnostic note.** The response identifies the non-linear structure correctly but
does not yet connect it to the novel's thematic concerns — technique-spotting rather
than analysis.

:::model
Roy's fractured chronology in [[The God of Small Things]] enacts the very disruption
of the "Love Laws" it depicts, so that narrative order itself becomes inseparable from
the novel's argument about transgression and consequence.
:::

(Sample content — replace with real diagnostic documents via the CMS.)`,
  });

  void introductionStructure;

  const literaryDevices = "Literary Devices";
  const structuralTerms = "Structural Terms";
  const analyticalVerbs = "Analytical Verbs";

  await upsertTerm(
    "Metaphor",
    "A direct comparison between two unlike things without using 'like' or 'as', implying one thing is another.",
    literaryDevices,
    "Torvald calls Nora his 'little skylark' — a metaphor that reduces her to a decorative pet.",
  );
  await upsertTerm(
    "Juxtaposition",
    "Placing two contrasting ideas or images side by side to sharpen the reader's sense of the contrast.",
    literaryDevices,
    "The sublime Arctic landscape juxtaposed against Victor's moral corruption in Frankenstein.",
  );
  await upsertTerm(
    "Dramatic Irony",
    "The audience knows something a character does not, creating tension between what is said and what is understood.",
    literaryDevices,
    "The audience recognises Nora's performed contentment as a mask long before Torvald does.",
  );
  await upsertTerm(
    "Symbolism",
    "An object, person, or event used to represent an abstract idea beyond its literal meaning.",
    literaryDevices,
    "The Christmas tree in A Doll's House, stripped bare by the final act, symbolises Nora's discarded domestic role.",
  );

  await upsertTerm(
    "Exposition",
    "The opening section of a narrative that establishes setting, character, and situation before the central conflict develops.",
    structuralTerms,
    null,
  );
  await upsertTerm(
    "Rising Action",
    "The sequence of events that builds tension and complicates the central conflict, leading toward the climax.",
    structuralTerms,
    null,
  );
  await upsertTerm(
    "Dominant Reading",
    "The interpretation a text's structure and technique most strongly invite, as opposed to alternative or resistant readings.",
    structuralTerms,
    null,
  );

  await upsertTerm(
    "Illuminates",
    "An analytical verb used to introduce how a technique clarifies or reveals meaning, rather than simply 'shows'.",
    analyticalVerbs,
    "The motif illuminates the character's internal conflict.",
  );
  await upsertTerm(
    "Underscores",
    "An analytical verb used to introduce how a technique reinforces or emphasises an idea already present in the text.",
    analyticalVerbs,
    "The juxtaposition underscores the gap between appearance and reality.",
  );
  await upsertTerm(
    "Interrogates",
    "An analytical verb used when a text questions or challenges an assumption, rather than simply presenting it.",
    analyticalVerbs,
    "The play interrogates the limits of domestic duty.",
  );

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
