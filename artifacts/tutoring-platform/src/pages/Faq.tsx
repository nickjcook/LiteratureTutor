import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface QA {
  q: string;
  a: React.ReactNode;
}

const faqs: QA[] = [
  {
    q: "What is this platform, in plain terms?",
    a: (
      <>
        It is a guided way to learn English and Literature for the WA (SCASA)
        curriculum, years 7–12. Rather than a pile of notes, it teaches a{" "}
        <em>method</em> — how to read closely and how to build an analytical
        paragraph — drawn from twenty years of classroom teaching. You work
        through it at your own pace, and it remembers where you are.
      </>
    ),
  },
  {
    q: "How do I get started?",
    a: (
      <>
        Log in using the button at the top right, then complete the short{" "}
        <strong>study profile</strong> (your year level, whether you take English
        or Literature, and your school). That profile is what tailors the platform
        to you — it decides which content is shown first on your Curriculum Map.
        You can be studying within a couple of minutes.
      </>
    ),
  },
  {
    q: "What is the Curriculum Map?",
    a: (
      <>
        The <Link href="/map" className="underline underline-offset-4 hover:text-foreground">Curriculum Map</Link>{" "}
        is your home base. It lays out the skills and topics for your year and
        course in the order they build on each other, and shows what you've
        looked at and what comes next. Start here when you're not sure what to do.
      </>
    ),
  },
  {
    q: "What is the Library?",
    a: (
      <>
        The <Link href="/library" className="underline underline-offset-4 hover:text-foreground">Library</Link>{" "}
        is the full collection of teaching documents — worked examples, guides and
        methodology — that you can browse or search directly, rather than following
        the map's suggested order. Use the map to know <em>what</em> to learn next;
        use the library to <em>find</em> a specific thing.
      </>
    ),
  },
  {
    q: "How do I read a document?",
    a: (
      <>
        Open any item from the map or library and it fills the screen for
        comfortable reading. Documents are written to be worked through, not just
        skimmed — take a section at a time. Where a document is downloadable, use
        the print/download control on the page.
      </>
    ),
  },
  {
    q: "What is the Metalanguage Dictionary?",
    a: (
      <>
        English and Literature come with a lot of specialist vocabulary
        (metalanguage). The dictionary — reachable from the button in the top bar —
        lets you look up any of those terms with a plain explanation, so an
        unfamiliar word never stops you. It's grouped by category (for example
        structural terms) so you can browse as well as search.
      </>
    ),
  },
  {
    q: "The text is hard to read. Can I make it bigger or change the colours?",
    a: (
      <>
        Yes. Open the <strong>Display &amp; accessibility</strong> control (the
        gear icon in the top bar — it's there whether or not you're logged in).
        You can switch between light, dark and automatic themes, make the text{" "}
        <strong>Large</strong> or <strong>Largest</strong>, turn on{" "}
        <strong>high contrast</strong> for easier reading, and switch to a{" "}
        <strong>colour-blind-friendly palette</strong>. Your choices are saved on
        your device.
      </>
    ),
  },
  {
    q: "Does it write my essays for me?",
    a: (
      <>
        No — and that's the point. It shows you model writing and gives feedback on{" "}
        <em>your</em> writing, but it does not produce finished essays for you to
        hand in. The goal is that you can write a strong analytical response
        yourself, which is what actually lifts your marks.
      </>
    ),
  },
  {
    q: "Does it give me a grade?",
    a: (
      <>
        Not a formal mark — grading your assessments is your school's job. What it
        can do is give general feedback (for example, why a piece reads as a B and
        what would lift it toward an A) and track your improvement over time.
      </>
    ),
  },
  {
    q: "Who can see my work and progress?",
    a: (
      <>
        Your account is your own. How your information is handled — and what, if
        anything, is shared with a parent or guardian — is set out in the{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </Link>
        . The{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms &amp; Conditions
        </Link>{" "}
        cover the rules of use.
      </>
    ),
  },
  {
    q: "I'm stuck or something isn't working.",
    a: (
      <>
        A support contact will be provided here before launch. In the meantime, if
        a page won't load, try refreshing, and make sure you're logged in for
        anything that shows your own progress.
      </>
    ),
  },
];

export default function Faq() {
  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">How to use this platform</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A quick guide to what's here and how to get the most from it. New to the
          platform? Read the first few answers in order; otherwise jump to whatever
          you need.
        </p>

        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-serif text-base">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Layout>
  );
}
