# The Storage Tech Dictionary
A fork of [https://JoakimThorsen.github.io/MCPropertyEncyclopedia](https://JoakimThorsen.github.io/MCPropertyEncyclopedia), used as a dictionary of storage tech-related terms, abbreviations and expressions related to Storage Tech and TMC, curated by contributors from the [Storage Tech Discord server](https://discord.gg/JufJ6uf).

## Contributing
If you wish to add a new term to the dictionary:
* Navigate to the file `data/dictionary.yaml`, click the edit (pencil) icon in the top right, and add a new entry in the appropriate spot (alphabetically sorted).
* The yaml format of the entry should look something like the following:
```
- term: Block Update Detector
  aka:
    - BUD
  tags:
    - Contraption
  description: >-
    A Block Update detector is a device that has something happen when it
    receives an update. Example: A piston that is @[Quasi-powered](Quasi
    connectivity) but not yet updated is called "BUDded", and will fire when
    updated. This term is sometimes used to refer to a component that is being
    QC powered by saying it's "BUD powered".
```
 * Multiple `aka` or `tags` entries can be listed. `aka` can be dropped if there are no frequently used synonyms or abbreviations.
 * Hyperlinks can be added with the format: `[anchor text](https://example.com)`
 * Entry mentions (which will link to other terms in the dictionary) can be added with either: `@[term]` or `@[alternative text](term)`.
 * Avoid exceeding 80 characters per line (including the leading spaces).
* Once you are finised with writing your entry, you should select the full contents of the file with Ctrl+A, and copy paste it into a YAML validator like [YAMLLint](https://YAMLLint.com/) to verify that the YAML is formatted correctly.
* Once it is, then you can write a short commit message describing your additions (or changes), and select "Create a new branch for this commit and start a pull request" at the bottom of the editor.

If you are a dictionary curator, then you may merge pull requests of any additions or changes that you find satisfactory.

## Technical details
The project is hosted through GitHub Pages. It operates entirely clientside and is written in vanilla js, with [jQuery 3.6](https://jquery.com/) and [Bootstrap 3.3.7](https://getbootstrap.com/docs/3.3/) being used for the interface. Most icons used are from [Font Awesome](https://fontawesome.com/).