#!/usr/bin/env python3
"""
Script to run Claude Code in headless mode to analyze a Flutter project
and generate agent skills based on the project's architecture.
"""

import subprocess
import sys
import argparse


def create_flutter_architecture_skill(project_path: str = ".", verbose: bool = False) -> int:
    """
    Run Claude Code to analyze a Flutter project and create architecture skills.

    Args:
        project_path: Path to the Flutter project (default: current directory)
        verbose: Enable verbose output

    Returns:
        Exit code from the claude command
    """
    # Define 8 different prompts
    prompts = [
        '''Analyze the project's architecture and folder structure then create project-architecture. Follow this Instruction:
        1. Use Glob to find all .dart files
        2. Identify the architectural pattern:
        * Clean Architecture (data/domain/presentation layers)
        * Feature-first organization
        * Layer-first organization
        * MVVM, MVC, or other patterns
        3. Create `.claude/skills/project-architecture/SKILL.md` with:
        1. Actual layer structure project is using
        2. Actual code flow from UI layer to data layer
        Keep the `SKILL.md` short and concise, only write 3 points mentioned. No other detail needed
        pattern of SKILL.md file
        ---
        name: project-architecture
        description: Reference this skill when creating new features, or understanding the project's layer organization and data flow patterns.
        ---
        # Detail information
        ''',
        '''
        Analyze how the project manages dependency injection (DI):
        1. Use Glob to find related `.dart` files
        2. Inspect `pubspec.yaml` for DI-related packages (examples):
            - `get_it`, `injectable`, `riverpod`, `provider`, `flutter_bloc`, `kiwi`, `get`
        3. Locate the DI setup entry points (examples):
            - `main.dart`, `app.dart`, `bootstrap.dart`, `locator.dart`, `di.dart`, `injection.dart`
        4. Detect DI style:
            - Service Locator (e.g., `GetIt`)
            - Code generation DI (e.g., `injectable`)
            - Provider-based DI (e.g., `Provider`, `Riverpod`)
        5. Identify patterns:
            - Module registration structure (core vs feature)
            - Singletons vs factories
            - Environment-based registration (dev/prod)
        6. Create `.claude/skills/dependency-injection/SKILL.md` with:
            1. Detected DI library + style
            2. Where registration happens (file paths)
            3. How a new service/repository should be registered (short steps)
            4. Common conventions found (naming, scopes)

        Keep the `SKILL.md` short and concise, describing the DI approach used in the project. only write 4 points mentioned
        ---
        name: dependency-injection
        description: Reference this skill when creating new cubit, repository, service, or understanding how dependencies are wired in the project.
        ---
        # Detail information
        ''',
        '''
        Analyze how the project communicates with APIs by follow these step:
        1. Use Glob to find related `.dart` files that handle calling back-end server. Also Inspect `pubspec.yaml` for networking packages (examples): `dio`, `http`, `retrofit`, `chopper`, `graphql`, `json_annotation`, `freezed`
        2. `.claude/skills/api-calling/skill.md` file, In `.claude/skills/api-calling` folder create `.claude/skills/api-calling/references/` folder contains 2 file: 
            - api_setup.md: Describe API client setup, includes:
                - Base URL configuration, Interceptors/middleware (auth, logging, retry), Timeout configuration
                - Token storage usage, refresh token flow presence.
            - api_workflow.md: Describe API handling patterns from view to actual api calling:
                - Repository pattern for remote data
                - Data sources / Service (e.g., `RemoteDataSource`)
                - How data from API is mapping to Dart object.
                - Error handling strategy (exceptions, Either/Result, failure models)
            
            The `api-calling/skill.md` file guide agent to read to correct reference file base on the problem agent is solving
        Keep all 3 files short and concise, aligned to the project’s current API style. Only write the mentioned point.
        ---
        name: api-calling
        description: Reference this skill when implementing API calls, creating new endpoints, handling network errors, or working with remote data sources.
        ---
        # Detail information
        ''',
        '''
        Analyze how the project stores data locally by follow these step:
        1. Use Glob to find related `.dart` files that handle local persistence. Also inspect `pubspec.yaml` for storage packages (examples):
            `shared_preferences`, `hive`, `hive_ce`, `isar`, `sqflite`, `drift`, `flutter_secure_storage`, `hydrated_bloc`
        2. Create `.claude/skills/local-storage/skill.md` file.
            In `.claude/skills/local-storage` folder create `.claude/skills/local-storage/references/` folder contains 2 files:
            - storage_setup.md: Describe local storage setup, includes:
                - Which local storage library is used (based on project usage)
                - Initialization/configuration location (ex: `main.dart`, `bootstrap.dart`, `storage.dart`, `db.dart`)
                - Database/box/schema setup (adapters, migrations, table definitions if any)
                - Sensitive storage handling if any (ex: tokens/credentials in secure storage)
                - Any environment config if any (dev/prod separation, encryption)
            - storage_workflow.md: Describe local storage handling patterns from app usage to actual read/write:
                - Where local storage is called from (Repository / DataSource / Service layer)
                - Cache strategy (write-through, read-through, fallback to remote, TTL if exists)
                - How data is mapped to dart object.
                - Key naming conventions / box naming conventions / table naming conventions
                - Error handling strategy (exceptions, Result/Either, failure models)
            The `local-storage/SKILL.md` file guide agent to read to correct reference file base on the problem agent is solving
        Keep all 3 files short and aligned to the project’s current Local Storage style. 
        Only write the mentioned point.
        Follow this format for SKILL.md file:
        ---
        name: local-storage
        description: *insert suitable description so the agent know when to use this skill
        ---
        # Detail information
        ''',
        '''
        Analyze how the project manages UI and business state:
        1. Use Glob to find state, view model (cubit, bloc, provider,…), use case`.dart` files
        2. Inspect `pubspec.yaml` for state management packages (examples):
            - `flutter_bloc`, `bloc`, `riverpod`, `provider`, `mobx`, `get`, `stacked`
        3. Create `.claude/skills/state-management/SKILL.md` file. In `.claude/skills/state-management` folder create `.claude/skills/state-management/references/` folder contains 2 files:
        - state_format.md: Describe a typical state file in the project:
            - How the state file is naming
            - What is the structure of the state file
            - How the state file are setup for different state (Initial, Loading,…)
        - view_model_format.md (you can change to cubit_format.md or provider_format.md)
            - How the view model file is naming?
            - How the repositories or other properties are being passed to initialize function of view model?
            - What is the structure of the file, what the structure of a function in view model?
        - use_case, event, or other file if necessary.

        The `state-management/SKILL.md` file:
        1. guide agent to read to correct reference file base on the problem agent is solving.
        2. Describe how the view is communicating with the view model, how view model is communicating with repository or service,…

        Keep all files short and aligned to the project’s current state management style.
        Only write the mentioned point.
        Follow this format for SKILL.md file:
        ---
        name: state-management
        description: Reference this skill when creating or modifying cubits, states, or understanding how UI communicates with business logic in this Flutter project.
        ---
        # Detail information
        ''',
        '''
        Analyze how the project building widgets and screens:
        1. Use Glob to find view, screen, widget .dart file
        2. Create `.claude/skills/ui-crafting/SKILL.md` file. In `.claude/skills/ui-crafting` folder, create `.claude/skills/ui-crafting/references/` folder contains these files:
            1. theme.md: Describe how a widget is using font, color and text styles:
                - Focus on how the actual Text widget are styling for the text, what is put after textStyles property? How they’re adding color for text, how the widget are picking styles for text. Just describe shortly how the actual Text Widget are using.
                - How a background or a button is colored? Just describe shortly how to add a color to a widget exactly like the current code is writing
                - Is there any pattern for spacing? Does all screens widget follow a same px number for padding? Describe shortly what are most common spacing numbers are being used and how the actual widget is using.
            2. navigation.md: Describe how the navigation system the project are using
                - Check `pubspec.yaml` files to see if the project are using any navigation package
                - Analyze how the navigation system write it shortly but concise from real widget:
                    - How the navigation system are being setup
                    - How a screen navigate to the other.
            3. translation.md: Describe how the project supports multi-language (skip if project doesn’t support multi-language) 
                - Find translation files location (examples):
                    - `arb/` files like `intl_en.arb`
                    - `assets/translations/*.json`
                    - generated localization output folder
                - Analyze how translation key is used in actual widget:
                    - What is written in `Text(...)` when it is translated?
                        Examples patterns: `S.of(context).title`, `context.tr('key')`, `'key'.tr()`
                    - How parameters are passed into translated text (if any)
                Keep it short, only describe how translation is used in real code.
            4. assets.md: Describe how the project loads and uses images/assets:
                - Check pubspec.yaml for asset setup:
                    - assets: section, fonts, svg/lottie assets
                    - packages like: flutter_svg, cached_network_image, lottie, rive
                - Analyze asset usage in real widget:
                    - How they load local assets (Image.asset, SvgPicture.asset, etc.)
                    - How they load remote images (Image.network, cached image widget, etc.)
                    - Where asset path constants are stored (if any) like AppImages, Assets, R
                Keep it short and describe only how the current project is doing it.
            5. form.md: Describe how the project builds forms and handles input (if any):
                - Analyze how real widgets handle:
                    - validation messages
                    - submit flow (button → validate → call action)
                    - focus handling (next/done/unfocus)
                    - error state display
                Keep it short and describe only how the current project is doing it. (skip if project doesn't have)
            6. common_widget.md: Describe how the project creates and reuses shared UI components
                - Use Glob to find shared widget folders (examples):
                    - `common/`, `shared/`, `widgets/`, `components/`, `ui/`
                - Identify most common reusable components:
                    - Buttons, TextField/Input, Dialog, BottomSheet, Loading, Error view, Empty state
                - Just write their class name and 1 line to describe when to use the component, no other information is needed
            The `ui-crafting/SKILL.md` file 
            - guide agent to read to correct reference file base on the problem agent is solving.
            - Use const for widget creation if possible
            Keep all files short and aligned to the project’s current UI handling style.
            Only write the mentioned point.
            Follow this format for SKILL.md file:
            ---
            name: ui-crafting
            description: Guide for building UI components, screens, and widgets. Reference when creating new screens, styling widgets, handling navigation, adding translations, loading assets, building forms, or reusing common components.
            ---
            # Detail information
        ''',
        '''
        Analyze how the project creates and reuses common non-UI helper logic (utilities, extensions, constants):
        1. Use Glob to find related `.dart` files that contain reusable logic such as:
            - Utility classes / helpers: `StringUtils`, `DateUtils`, `Validator`, `Formatter`
            - Extensions: `extension StringX on String`, `BuildContext` extensions
            - Mixins / helpers for repeated logic that pure Dart (no relate to UI or Flutter)
        2. Create `.claude/skills/utilities/SKILL.md` file.
            In `.claude/skills/utilities` folder, create `.claude/skills/utilities/references/` folder with each type (String, Date,…) create a md file inside `references` folder:
            - In that file, write Utilities class name and list of function name with 1 line describe what the function is doing.
            The `utilities/SKILL.md` file guide agent to read to correct reference file base on the problem agent is solving
        Keep all files short and concise, aligned to the project's current utilities file.
        Only write the mentioned point.
        Follow this format for SKILL.md file:
        ---
        name: utilities
        description: Reference when working with utilities/helper or need to check existing utility functions before creating new ones
        ---
        # Detail information
        ''',
        '''
        Analyze the project’s testing approach and create a short agent skills for writing tests that match the current project style.
        Skip this if no test exist in the project (or project only contain default flutter test)
        1. Inspect `pubspec.yaml` for test libraries and tools (examples):
            `flutter_test`, `test`, `mocktail`, `mockito`, `bloc_test`, `integration_test`, `golden_toolkit`, `flutter_driver`
        2. Use Glob to locate test folders and conventions:
            - `test/`, `integration_test/`
            - naming patterns: `_test.dart`
            - folder structure mirrors `lib/` or feature-based grouping
        3. Detect testing types being used:
            - Unit tests (utils, usecases, repository, services)
            - Widget tests (widgets, screens, UI behavior)
            - Integration tests / E2E flows
            - Golden tests (snapshots)
        4. Identify common patterns used in real tests:
            - Mocking approach (mocktail/mockito/fakes)
            - Setup/teardown usage
            - Test helpers (example: `pumpApp`, `pumpWidgetWithDependencies`, `mockNavigator`, `fakeApi`)
            - Bloc/Riverpod testing patterns (if used)
        5. Create `.claude/skills/test-writing/SKILL.md` file, describe how to write tests following current project patterns:
            - Folder structure and naming rules
            - How a test of a widget, a repository, a view_model,… is being written in the project.
            - How to mock dependencies (DI + mocks)
            - Common assertion style and naming conventions
            - How to test error/loading/success states

        Keep the file short and concise, aligned to the project’s current testing style.
        ---
        name: test-writing
        description: *insert description to help agent know when to read this 
        ---
        # Detail information
        '''
    ]

    print(f"🔍 Analyzing Flutter project at: {project_path}")
    print(f"⏳ Running {len(prompts)} Claude Code commands in headless mode...")
    print("=" * 50)

    failed_commands = []

    # Run each command sequentially
    for i, prompt in enumerate(prompts, 1):
        print(f"\n📝 Command {i}/{len(prompts)}")
        print("-" * 50)

        cmd = [
            "claude",
            "-p", prompt,
            "--allowedTools", "Read,Write,Glob"  # These are TWO separate arguments
        ]

        if verbose:
            cmd.extend(["--output-format", "stream-json", "--verbose"])
        else:
            cmd.extend(["--output-format", "text"])

        try:
            # Run the command in the specified project directory
            result = subprocess.run(
                cmd,
                cwd=project_path,
                text=True,
                capture_output=False  # Stream output directly to terminal
            )

            if result.returncode == 0:
                print(f"✅ Command {i} completed successfully!")
            else:
                print(f"❌ Command {i} exited with code: {result.returncode}")
                failed_commands.append(i)

        except FileNotFoundError:
            print("❌ Error: 'claude' command not found.")
            print("   Make sure Claude Code is installed: npm install -g @anthropic-ai/claude-code")
            return 1
        except Exception as e:
            print(f"❌ Error running Claude Code: {e}")
            failed_commands.append(i)

    # Summary
    print("\n" + "=" * 50)
    if not failed_commands:
        print(f"✅ All {len(prompts)} commands completed successfully!")
        print(f"📄 Check: {project_path}/.claude/skills/")
        return 0
    else:
        print(f"⚠️  {len(failed_commands)} command(s) failed: {failed_commands}")
        return 1


def main():
    parser = argparse.ArgumentParser(
        description="Analyze a Flutter project and create Claude Code agent skills"
    )
    parser.add_argument(
        "project_path",
        nargs="?",
        default=".",
        help="Path to the Flutter project (default: current directory)"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    exit_code = create_flutter_architecture_skill(
        project_path=args.project_path,
        verbose=args.verbose
    )
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()