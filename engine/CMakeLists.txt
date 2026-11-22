cmake_minimum_required(VERSION 3.22)

project(dawdaw_engine VERSION 0.0.1 LANGUAGES C CXX)

if (APPLE)
    set(CMAKE_OSX_DEPLOYMENT_TARGET "12.0" CACHE STRING "Minimum macOS version")
endif()

if (MSVC)
    set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

set_property(GLOBAL PROPERTY USE_FOLDERS YES)

# JUCE comes bundled inside Tracktion Engine so both versions always match.
set(TRACKTION_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/tracktion_engine")
add_subdirectory("${TRACKTION_DIR}/modules/juce" juce EXCLUDE_FROM_ALL)
add_subdirectory("${TRACKTION_DIR}/modules" tracktion EXCLUDE_FROM_ALL)

juce_add_console_app(dawdaw_engine
    PRODUCT_NAME "dawdaw-engine")

target_sources(dawdaw_engine PRIVATE
    src/Main.cpp)

target_compile_features(dawdaw_engine PRIVATE cxx_std_20)

target_compile_definitions(dawdaw_engine PRIVATE
    JUCE_PLUGINHOST_AU=0
    JUCE_PLUGINHOST_VST3=1
    JUCE_USE_CURL=0
    JUCE_WEB_BROWSER=0
    JUCE_STRICT_REFCOUNTEDPOINTER=1
    JUCE_MODAL_LOOPS_PERMITTED=1
    TRACKTION_ENABLE_TIMESTRETCH_SOUNDTOUCH=1
    TRACKTION_LOG_DEVICES=0)

target_link_libraries(dawdaw_engine PRIVATE
    tracktion::tracktion_core
    tracktion::tracktion_engine
    tracktion::tracktion_graph
    juce::juce_audio_basics
    juce::juce_audio_devices
    juce::juce_audio_formats
    juce::juce_audio_processors
    juce::juce_audio_utils
    juce::juce_recommended_config_flags
    juce::juce_recommended_warning_flags)

if (APPLE)
    # Same flags Tracktion's own examples use on macOS.
    target_compile_options(dawdaw_engine PRIVATE -fno-aligned-allocation)
endif()
