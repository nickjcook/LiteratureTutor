import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import {
  useListMetalanguageTerms,
  getListMetalanguageTermsQueryKey,
} from "@workspace/api-client-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

// A slide-over, not a page navigation, so a student can look up a term from
// inside any document without losing their place (spec section 2.6).
export function MetalanguageDictionary() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: terms, isLoading } = useListMetalanguageTerms(
    {},
    { query: { enabled: open, queryKey: getListMetalanguageTermsQueryKey({}) } },
  );

  const tabs = useMemo(() => {
    const unique = [...new Set((terms ?? []).map((t) => t.tab))];
    return unique.sort();
  }, [terms]);

  const filtered = useMemo(() => {
    if (search.trim() === "") return terms ?? [];
    const needle = search.trim().toLowerCase();
    return (terms ?? []).filter(
      (t) =>
        t.term.toLowerCase().includes(needle) ||
        t.definition.toLowerCase().includes(needle),
    );
  }, [terms, search]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-open-dictionary">
          <BookOpen className="mr-1.5 h-4 w-4" />
          Dictionary
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif">Metalanguage Dictionary</SheetTitle>
          <SheetDescription>
            Look up a curriculum term without leaving what you're reading.
          </SheetDescription>
        </SheetHeader>

        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms..."
            className="pl-8"
            data-testid="input-dictionary-search"
          />
        </div>

        {isLoading && (
          <p className="mt-4 text-sm text-muted-foreground">Loading terms…</p>
        )}

        {!isLoading && search.trim() !== "" && (
          <ScrollArea className="mt-4 flex-1">
            <TermList terms={filtered} />
          </ScrollArea>
        )}

        {!isLoading && search.trim() === "" && tabs.length > 0 && (
          <Tabs defaultValue={tabs[0]} className="mt-4 flex flex-1 flex-col overflow-hidden">
            <TabsList className="w-full flex-wrap justify-start">
              {tabs.map((tab) => (
                <TabsTrigger key={tab} value={tab} data-testid={`tab-${tab}`}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab} value={tab} className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-2">
                  <TermList terms={(terms ?? []).filter((t) => t.tab === tab)} />
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {!isLoading && tabs.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">No terms yet.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TermList({ terms }: { terms: { id: number; term: string; definition: string; example: string | null }[] }) {
  if (terms.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">No matching terms.</p>;
  }
  return (
    <dl className="space-y-4 pb-4">
      {terms.map((t) => (
        <div key={t.id} data-testid={`term-${t.id}`}>
          <dt className="font-semibold text-foreground">{t.term}</dt>
          <dd className="mt-0.5 text-sm text-muted-foreground">{t.definition}</dd>
          {t.example && (
            <dd className="mt-1 text-sm italic text-foreground/70">e.g. {t.example}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}
