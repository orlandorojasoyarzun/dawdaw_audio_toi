#include <tracktion_engine/tracktion_engine.h>

#include <iostream>

namespace te = tracktion::engine;

int main()
{
    // Starts JUCE's message system; the audio device layer needs it on macOS.
    juce::ScopedJuceInitialiser_GUI juceInit;

    te::Engine engine { "dawdaw" };

    auto& audioDevices = engine.getDeviceManager().deviceManager;

    std::cout << "dawdaw-engine up\n";

    for (auto* type : audioDevices.getAvailableDeviceTypes())
    {
        type->scanForDevices();

        std::cout << "[" << type->getTypeName() << "]\n";

        for (auto& name : type->getDeviceNames(false))
            std::cout << "  out: " << name << "\n";
    }

    return 0;
}
