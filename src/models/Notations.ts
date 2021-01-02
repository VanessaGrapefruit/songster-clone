export enum Duration { // size of note in fractions of quarter
    'Whole' = 4,
    'Half' = 2,
    'Quarter' = 1,
    'Eighth' = 0.5,
    'Sixteen' = 0.25,
    'ThirtySecond' = 0.125,

    'WholeWithDot' = 6,
    'HalfWithDot' = 3,
    'QuarterWithDot' = 1.5,
    'EighthWithDot' = 0.75,
    'SixteenWithDot' = 0.375,
    'ThirtySecondWithDot' = 0.1875,
}

export enum Clef {
    'Bass',
    'Treble',
}

export interface Size { // number of beats per measure = Count/Per
    Count: number;
    Per: number;
}

export enum Touch {
    Staccato,
    Accent,
    Legato,
    NonLegato
}

export enum NoteName {
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
    'B#'
}