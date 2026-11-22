#pragma once

#include <juce_audio_devices/juce_audio_devices.h>

#include <atomic>
#include <cmath>

/** Plays a sine tone for a MIDI note. Throwaway test source to prove audio reaches the speakers. */
class ToneGenerator : public juce::AudioIODeviceCallback
{
public:
    // noteOn/noteOff can be called from any thread. The audio thread picks the values up
    // and fades towards them.
    void noteOn (int midiNote)
    {
        frequencyHz.store (440.0 * std::pow (2.0, (midiNote - 69) / 12.0));
        targetGain.store (peakGain);
    }

    void noteOff()
    {
        targetGain.store (0.0f);
    }

    void audioDeviceAboutToStart (juce::AudioIODevice* device) override
    {
        sampleRate = device->getCurrentSampleRate();
    }

    void audioDeviceStopped() override {}

    // Runs on the audio thread, once per buffer. No allocation, no locks, no printing in here.
    void audioDeviceIOCallbackWithContext (const float* const*, int,
                                           float* const* output, int numOutputChannels,
                                           int numSamples,
                                           const juce::AudioIODeviceCallbackContext&) override
    {
        const float target = targetGain.load();
        const double phaseStep = juce::MathConstants<double>::twoPi * frequencyHz.load() / sampleRate;

        for (int i = 0; i < numSamples; ++i)
        {
            gain += (target - gain) * 0.002f; // short fade in/out, avoids clicks

            const auto sample = static_cast<float> (std::sin (phase)) * gain;
            phase += phaseStep;
            if (phase >= juce::MathConstants<double>::twoPi)
                phase -= juce::MathConstants<double>::twoPi;

            for (int ch = 0; ch < numOutputChannels; ++ch)
                if (output[ch] != nullptr)
                    output[ch][i] = (ch < 2) ? sample : 0.0f; // stereo out, other channels silent
        }
    }

private:
    static constexpr float peakGain = 0.1f; // about -20 dB, deliberately quiet

    std::atomic<double> frequencyHz { 440.0 };
    std::atomic<float> targetGain { 0.0f };
    double sampleRate = 44100.0;
    float gain = 0.0f;
    double phase = 0.0;
};
