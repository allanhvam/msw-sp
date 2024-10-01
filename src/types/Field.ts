type ComputedField = {
    typeAsString: "Computed";
}

type TextField = {
    typeAsString: "Text";
}

type NumberField = {
    typeAsString: "Number";
}

type DateTimeField = {
    typeAsString: "DateTime";
}

type CounterField = {
    typeAsString: "Counter";
}

type NoteField = {
    typeAsString: "Note";
    richText?: boolean;
    richTextMode?: "RichTextMode";
}

type LookupField = {
    typeAsString: "Lookup";
    lookupField: string;
    lookupList: string;
}

export type Field = {
    title: string;
    description?: string;
    internalName: string;
    hidden?: boolean;
    readOnlyField?: boolean;
} & (TextField |
    LookupField |
    ComputedField |
    NumberField |
    DateTimeField |
    CounterField |
    NoteField);

