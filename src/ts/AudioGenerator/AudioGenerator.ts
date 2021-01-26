import { Midi, Track } from '@tonejs/midi';
import * as Tone from 'tone';
import Store, { EVENTS } from '../Store';
import SampleLibrary from '../../../tonejs-instruments/Tonejs-Instruments';
import { Instrument } from '@tonejs/midi/dist/Instrument';
import { instruments } from './MidiInstruments';

enum Volume {
  SelectedTrack = 0,
  DefaultTrack = -10,
}

export class AudioGenerator {
  private midi: Midi;
  private store: Store;
  private toneTracks: Tone.Part[];
  private currentTrackId: number;
  private timeOffset: number;

  constructor(midiData: ArrayBuffer, store: Store) {
    this.store = store;
    this.midi = new Midi(midiData);
    this.toneTracks = [];
    this.currentTrackId = 0;
    this.timeOffset = 0;

    this.play = this.play.bind(this);
    this.stopMusic = this.stopMusic.bind(this);
    this.setTimeOffset = this.setTimeOffset.bind(this);
    this.changeTrack = this.changeTrack.bind(this);
  }

  init() {
    this.store.eventEmitter.addEvent(EVENTS.PLAY_BUTTON_CLICK, this.play);
    this.store.eventEmitter.addEvent(EVENTS.TIME_MARKER_POSITION_CHANGED, this.setTimeOffset);
    this.store.eventEmitter.addEvent(EVENTS.END_OF_SONG, this.stopMusic);
    this.store.eventEmitter.addEvent(EVENTS.SELECT_INSTRUMENT, this.changeTrack);

    Tone.Transport.bpm.value = this.midi.header.tempos[0].bpm;
    Tone.Transport.timeSignature = this.midi.header.timeSignatures[0].timeSignature;

    this.initTracks();
  }

  initTracks() {
    this.midi.tracks.forEach((track, id) => {
      const volume = id === this.currentTrackId ? +Volume.SelectedTrack : +Volume.DefaultTrack;
      this.initTonePart(track, volume);
    });
  }

  initTonePart(track: Track, volumeLevel: number) {
    const synth = this.getSynth(track.instrument);
    if (!synth) return;

    const volume = new Tone.Volume(volumeLevel).toDestination();
    synth.connect(volume);

    const part = new Tone.Part((time, note) => {
      synth.triggerAttackRelease(note.name, note.duration, time, note.velocity);
    }, track.notes);
    this.toneTracks.push(part);
  }

  changeTrack() {
    Tone.Transport.cancel();
    this.setCurrentTrack(this.store.selectedInstrumentId);
    this.toneTracks = [];
    this.initTracks();
    if (this.store.playMusic) {
      this.start();
    }
  }

  play() {
    console.log(this.store.playMusic, 'offset', this.timeOffset);

    if (this.store.playMusic) {
      this.start();
    } else {
      this.pause();
    }
  }

  stopMusic() {
    this.timeOffset = 0;
    Tone.Transport.stop();
  }

  start() {
    this.toneTracks.forEach((part) => {
      part.start(undefined, this.timeOffset);
    });
    Tone.Transport.start(undefined, this.timeOffset);
    Tone.start();
  }

  pause() {
    Tone.Transport.pause();
  }

  setTimeOffset() {
    const second: number = 1000;

    this.timeOffset = this.store.songTime / second;

    if (this.store.playMusic) {
      Tone.Transport.pause();
      this.play();
    }
  }

  setCurrentTrack(id: number) {
    this.currentTrackId = id;
  }

  getSynth(instrument: Instrument) {
    console.log(instrument.number, instrument.name);
    console.log('-------------');
    const name = instrument.name;
    const instrumentObj = instruments.find((obj) => obj.id === name);
    if (!instrumentObj || !instrumentObj.name) return;

    return SampleLibrary.load({
      instruments: instrumentObj.name,
      ext: '.ogg',
    });
  }
}
