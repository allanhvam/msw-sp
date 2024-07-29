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

type LookupField = {
    typeAsString: "Lookup";
    lookupField: string;
    lookupList: string;
}

export type Field = {
    title: string;
    description?: string;
    internalName: string;
} & (TextField |
    LookupField |
    ComputedField |
    NumberField |
    DateTimeField |
    CounterField);

