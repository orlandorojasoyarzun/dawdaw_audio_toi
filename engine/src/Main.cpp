#include <tracktion_engine/tracktion_engine.h>

#include "ToneGenerator.h"

#include <iostream>
#include <sstream>
#include <string>

namespace te = tracktion::engine;

namespace
{
// One line: the buffer we chose and the total output latency the driver reports.
// On CoreAudio the reported latency follows 2 * buffer + a fixed part, so it already
// includes the buffer; the two numbers must not be added together.
std::string latencySummary (juce::AudioIODevice& device)
{
    const auto toMs = [rate = device.getCurrentSampleRate()] (int samples)
    {
        return 1000.0 * samples / rate;
    };

    const int bufferSamples = device.getCurrentBufferSizeSamples();
    const int outputSamples = device.getOutputLatencyInSamples();

    std::ostringstream out;
    out << "buffer " << bufferSamples << " samples = " << toMs (bufferSamples) << " ms, "
        << "output latency " << outputSamples << " samples = " << toMs (outputSamples) << " ms";
    return out.str();
}

void printDeviceInfo (juce::AudioIODevice& device)
{
    std::cout << "device " << device.getName() << " (" << device.getTypeName() << ")\n"
              << "rate " << device.getCurrentSampleRate() << " Hz\n"
              << "latency " << latencySummary (device) << "\n";
}

// Returns an error message, or an empty string on success.
juce::String setBufferSize (juce::AudioDeviceManager& audioDevices, int samples)
{
    auto setup = audioDevices.getAudioDeviceSetup();
    setup.bufferSize = samples;
    return audioDevices.setAudioDeviceSetup (setup, true);
}
} // namespace

// Commands arrive as one text line each on stdin:  noteOn <midi note>,  noteOff,  quit
// Every command is answered with one line on stdout: "ok" or "error <reason>".
int main()
{
    // Starts JUCE's message system; the audio device layer needs it on macOS.
    juce::ScopedJuceInitialiser_GUI juceInit;

    // Creating the engine also opens the default audio device.
    te::Engine engine { "dawdaw" };

    auto& audioDevices = engine.getDeviceManager().deviceManager;
    if (audioDevices.getCurrentAudioDevice() == nullptr)
    {
        std::cerr << "no audio device is open\n";
        return 1;
    }

    ToneGenerator tone;
    audioDevices.addAudioCallback (&tone);

    printDeviceInfo (*audioDevices.getCurrentAudioDevice());
    std::cout << "ready\n" << std::flush;

    std::string line;
    while (std::getline (std::cin, line)) // returns false when stdin closes
    {
        std::istringstream in (line);
        std::string command;
        in >> command;

        if (command.empty())
            continue;

        if (command == "noteOn")
        {
            int note = 69; // A4 unless told otherwise
            in >> note;
            tone.noteOn (juce::jlimit (0, 127, note));
            std::cout << "ok\n";
        }
        else if (command == "noteOff")
        {
            tone.noteOff();
            std::cout << "ok\n";
        }
        else if (command == "buffer")
        {
            int samples = 0;
            in >> samples;

            if (samples < 32 || samples > 4096)
            {
                std::cout << "error buffer must be between 32 and 4096 samples\n";
            }
            else if (const auto error = setBufferSize (audioDevices, samples); error.isNotEmpty())
            {
                std::cout << "error " << error << "\n";
            }
            else
            {
                std::cout << "ok " << latencySummary (*audioDevices.getCurrentAudioDevice()) << "\n";
            }
        }
        else if (command == "quit")
        {
            std::cout << "ok\n";
            break;
        }
        else
        {
            std::cout << "error unknown command: " << command << "\n";
        }

        std::cout << std::flush;
    }

    tone.noteOff();
    juce::Thread::sleep (300); // let the fade-out finish before removing the callback
    audioDevices.removeAudioCallback (&tone);
    return 0;
}
