#pragma once

#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_audio_devices/juce_audio_devices.h>
#include <juce_audio_formats/juce_audio_formats.h>

#include <memory>

/** Plays one loaded sample on every key, pitched by the note, with several notes at once. */
class Sampler : public juce::AudioIODeviceCallback
{
public:
    Sampler()
    {
        formats.registerBasicFormats();
        for (int i = 0; i < numVoices; ++i)
            synth.addVoice (new juce::SamplerVoice());
    }

    /** Loads an audio file. Returns an error message, or an empty string on success.
        On success `description` says what was loaded. Call from the command thread, not the audio thread. */
    juce::String load (const juce::File& file, juce::String& description)
    {
        if (! file.existsAsFile())
            return "file not found: " + file.getFullPathName();

        std::unique_ptr<juce::AudioFormatReader> reader (formats.createReaderFor (file));
        if (reader == nullptr)
            return "cannot read as audio: " + file.getFullPathName();

        juce::BigInteger allKeys;
        allKeys.setRange (0, 128, true);

        // Root note 60: pressing middle C plays the sample at its original pitch.
        // The sound is copied into memory here, so the reader can be discarded.
        auto* sound = new juce::SamplerSound (file.getFileNameWithoutExtension(), *reader, allKeys,
                                              rootNote, attackSeconds, releaseSeconds, maxSampleSeconds);
        synth.clearSounds();
        synth.addSound (sound);

        description = file.getFileName() + ", "
                    + juce::String (static_cast<double> (reader->lengthInSamples) / reader->sampleRate, 2) + " s, "
                    + juce::String (reader->sampleRate, 0) + " Hz, "
                    + juce::String (static_cast<int> (reader->numChannels)) + " ch";
        return {};
    }

    // Safe to call from any thread: messages wait in a queue until the audio thread takes them.
    void noteOn (int note, int velocity)
    {
        midi.addMessageToQueue (juce::MidiMessage::noteOn (1, note, static_cast<juce::uint8> (velocity)));
    }

    void noteOff (int note)
    {
        midi.addMessageToQueue (juce::MidiMessage::noteOff (1, note));
    }

    void allNotesOff()
    {
        midi.addMessageToQueue (juce::MidiMessage::allNotesOff (1));
    }

    void audioDeviceAboutToStart (juce::AudioIODevice* device) override
    {
        const auto rate = device->getCurrentSampleRate();
        synth.setCurrentPlaybackSampleRate (rate);
        midi.reset (rate);
    }

    void audioDeviceStopped() override {}

    // Runs on the audio thread, once per buffer. No allocation, no printing in here.
    void audioDeviceIOCallbackWithContext (const float* const*, int,
                                           float* const* output, int numOutputChannels,
                                           int numSamples,
                                           const juce::AudioIODeviceCallbackContext&) override
    {
        for (int ch = 0; ch < numOutputChannels; ++ch)
            if (output[ch] != nullptr)
                juce::FloatVectorOperations::clear (output[ch], numSamples);

        // Render into the first two output channels (stereo); the rest stay silent.
        if (numOutputChannels < 2 || output[0] == nullptr || output[1] == nullptr)
            return;

        juce::AudioBuffer<float> stereo (const_cast<float**> (output), 2, numSamples);

        incomingMidi.clear();
        midi.removeNextBlockOfMessages (incomingMidi, numSamples);
        synth.renderNextBlock (stereo, incomingMidi, 0, numSamples);
        stereo.applyGain (masterGain);
    }

private:
    static constexpr int numVoices = 16;
    static constexpr int rootNote = 60;
    static constexpr double attackSeconds = 0.002;
    static constexpr double releaseSeconds = 0.08;   // long enough to avoid a click on note-off
    static constexpr double maxSampleSeconds = 60.0;
    static constexpr float masterGain = 0.4f;        // headroom for several voices; will become a parameter

    juce::AudioFormatManager formats;
    juce::Synthesiser synth;
    juce::MidiMessageCollector midi;
    juce::MidiBuffer incomingMidi;
};
