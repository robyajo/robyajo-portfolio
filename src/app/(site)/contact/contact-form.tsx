"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { submitContactMessage } from "@/app/(site)/contact/actions";
import {
    contactFormSchema,
    CONTACT_LIMITS,
    type ContactFormValues,
} from "@/lib/contact-schema";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    TypographyH3,
    TypographyMuted,
    TypographyP,
} from "@/components/ui/typography";
import { useDictionary } from "@/lib/i18n/provider";

export function ContactForm() {
    const content = useDictionary().contactPage;
    const [sent, setSent] = useState(false);
    const form = useForm<ContactFormValues>({
        resolver: standardSchemaResolver(contactFormSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
            website: "",
        },
    });

    async function onSubmit(values: ContactFormValues) {
        const result = await submitContactMessage(values);
        if (!result.success) {
            form.setError("root", { message: result.error });
            return;
        }
        form.reset();
        setSent(true);
    }

    if (sent) {
        return (
            <div className="flex flex-col gap-3 rounded-xl border border-line p-6">
                <TypographyH3>{content.successTitle}</TypographyH3>
                <TypographyP>{content.successBody}</TypographyP>
                <Button
                    type="button"
                    variant="outline"
                    className="mt-2 w-max"
                    onClick={() => setSent(false)}
                >
                    {content.sendAnother}
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-5"
                noValidate
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{content.nameLabel}</FormLabel>
                                <FormControl>
                                    <Input
                                        autoComplete="name"
                                        maxLength={CONTACT_LIMITS.name}
                                        placeholder={content.namePlaceholder}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{content.emailLabel}</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        autoComplete="email"
                                        maxLength={CONTACT_LIMITS.email}
                                        placeholder={content.emailPlaceholder}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{content.subjectLabel}</FormLabel>
                            <FormControl>
                                <Input
                                    maxLength={CONTACT_LIMITS.subject}
                                    placeholder={content.subjectPlaceholder}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{content.messageLabel}</FormLabel>
                            <FormControl>
                                <Textarea
                                    rows={7}
                                    maxLength={CONTACT_LIMITS.message}
                                    placeholder={content.messagePlaceholder}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                {content.messageHint}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[-9999px] h-px w-px overflow-hidden"
                >
                    <Label htmlFor="contact-website">Website</Label>
                    <Input
                        id="contact-website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        {...form.register("website")}
                    />
                </div>

                {form.formState.errors.root && (
                    <TypographyMuted role="alert">
                        {form.formState.errors.root.message}
                    </TypographyMuted>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting
                            ? content.sending
                            : content.send}
                    </Button>
                    <TypographyMuted>
                        {content.privacyNote}
                    </TypographyMuted>
                </div>
            </form>
        </Form>
    );
}
