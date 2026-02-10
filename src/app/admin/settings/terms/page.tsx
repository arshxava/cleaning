'use client';

import { z } from 'zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

/* ---------------- VALIDATION ---------------- */

const schema = z.object({
  content: z.string().min(10, 'Terms must be at least 10 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function AdminTermsPage() {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { content: '' },
  });

  /* ---------------- LOAD TERMS ---------------- */

  useEffect(() => {
    fetch('/api/settings/terms')
      .then(res => res.json())
      .then(data => {
        form.reset({ content: data?.content || '' });
      });
  }, [form]);

  /* ---------------- FORMAT HANDLER ---------------- */

  const applyFormat = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      toast({
        variant: 'destructive',
        title: 'Select text first',
        description: 'Please select text before applying formatting.',
      });
      return;
    }

    const selectedText = textarea.value.substring(start, end);

    const wrappedText = tag.startsWith('span')
      ? `<${tag}>${selectedText}</span>`
      : `<${tag}>${selectedText}</${tag}>`;

    textarea.setRangeText(wrappedText, start, end, 'end');

    form.setValue('content', textarea.value, { shouldDirty: true });
  };

  /* ---------------- PARAGRAPH NORMALIZER ---------------- */

  const normalizeParagraphs = (text: string) => {
    return text
      .split('\n\n') // double enter = paragraph
      .map(p => `<p>${p.replace(/\n/g, '<br />')}</p>`)
      .join('');
  };

  /* ---------------- SAVE ---------------- */

  const onSubmit = async (values: FormValues) => {
    const formattedContent = normalizeParagraphs(values.content);

    const res = await fetch('/api/settings/terms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: formattedContent }),
    });

    if (res.ok) {
      toast({ title: 'Terms updated successfully' });
    }
  };

  /* ================= UI ================= */

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms & Conditions</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* FORMAT TOOLBAR */}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => applyFormat('b')}>
                Bold
              </Button>

              <Button type="button" variant="outline" onClick={() => applyFormat('i')}>
                Italic
              </Button>

              <Button type="button" variant="outline" onClick={() => applyFormat('h2')}>
                Heading
              </Button>

              <Button type="button" variant="outline" onClick={() => applyFormat('h3')}>
                Sub Heading
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => applyFormat('span style="font-size:18px"')}
              >
                Bigger Text
              </Button>
            </div>

            {/* TEXTAREA */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={14}
                      placeholder="Enter terms and conditions..."
                      {...field}
                      ref={el => {
                        field.ref(el);
                        textareaRef.current = el;
                      }}
                    />
                  </FormControl>

                  <p className="text-xs text-muted-foreground">
                    Press Enter twice for new paragraphs. Supports bold, italic, headings.
                  </p>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Save</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
