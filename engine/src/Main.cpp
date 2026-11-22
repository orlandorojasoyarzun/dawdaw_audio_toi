#include <tracktion_engine/tracktion_engine.h>

#include "Sampler.h"

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

// Reads an optional integer argument, e.g. the "60" in "noteOn 60". Keeps `value` if absent.
bool readOptionalInt (std::istringstream& in, int& value)
{
    in >> std::ws;
    if (in.eof())
        return true;
    return static_cast<bool> (in >> value);
}
} // namespace

// Commands arrive as one text line each on stdin:
//   load <path to an audio file>
//   noteOn <note 0-127> [velocity 1-127]      noteOff [note]   (no note = release everything)
//   buffer <samples>                          quit
// Every command is answered with one line on stdout: "ok ..." or "error <reason>".
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

    Sampler sampler;
    audioDevices.addAudioCallback (&sampler);

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

        if (command == "load")
        {
            std::string path;
            std::getline (in >> std::ws, path); // the rest of the line, spaces included

            juce::String description;
            if (const auto error = sampler.load (juce::File (path), description); error.isNotEmpty())
                std::cout << "error " << error << "\n";
            else
                std::cout << "ok loaded " << description << "\n";
        }
        else if (command == "noteOn")
        {
            int note = 60;
            int velocity = 100;
            if (! readOptionalInt (in, note) || ! readOptionalInt (in, velocity))
            {
                std::cout << "error noteOn expects numbers\n";
            }
            else
            {
                sampler.noteOn (juce::jlimit (0, 127, note), juce::jlimit (1, 127, velocity));
                std::cout << "ok\n";
            }
        }
        else if (command == "noteOff")
        {
            int note = -1;
            if (! readOptionalInt (in, note))
            {
                std::cout << "error noteOff expects a number\n";
            }
            else
            {
                if (note < 0)
                    sampler.allNotesOff();
                else
                    sampler.noteOff (juce::jlimit (0, 127, note));
                std::cout << "ok\n";
            }
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

    sampler.allNotesOff();
    juce::Thread::sleep (300); // let the release tails finish before removing the callback
    audioDevices.removeAudioCallback (&sampler);
    return 0;
}
