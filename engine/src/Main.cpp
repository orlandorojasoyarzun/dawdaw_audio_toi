#include <tracktion_engine/tracktion_engine.h>

#include "ToneGenerator.h"

#include <iostream>
#include <sstream>
#include <string>

namespace te = tracktion::engine;

namespace
{
void printDeviceInfo (te::Engine& engine)
{
    auto* device = engine.getDeviceManager().deviceManager.getCurrentAudioDevice();
    if (device == nullptr)
        return;

    const auto toMs = [rate = device->getCurrentSampleRate()] (int samples)
    {
        return 1000.0 * samples / rate;
    };

    const int bufferSamples = device->getCurrentBufferSizeSamples();
    const int driverSamples = device->getOutputLatencyInSamples();

    std::cout << "device " << device->getName() << " (" << device->getTypeName() << ")\n"
              << "rate " << device->getCurrentSampleRate() << " Hz\n"
              << "buffer " << bufferSamples << " samples = " << toMs (bufferSamples) << " ms\n"
              << "driver " << driverSamples << " samples = " << toMs (driverSamples)
              << " ms (reported by the driver, on top of the buffer)\n";
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

    printDeviceInfo (engine);
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
