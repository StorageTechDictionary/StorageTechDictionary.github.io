# The Storage Tech Dictionary
A fork of [https://JoakimThorsen.github.io/MCPropertyEncyclopedia](https://JoakimThorsen.github.io/MCPropertyEncyclopedia), used as a dictionary of storage tech-related terms, abbreviations and expressions related to Storage Tech and TMC, curated by contributors from the [Storage Tech Discord server](https://discord.gg/JufJ6uf).

## Contributing
If you wish to add a new term to the dictionary:
* Nnavigate to the file `data/dictionary.json`, click the edit (pencil) icon in the top right, and add a new entry at the bottom of the file (but within the square brackets).
The json format of the entry should look something like the following:
```json
[
    ...
    {
        "term": "<term>",
        "aka": [<a list of alternative names or abbreviations, if any>],
        "description": "<an informative description, that preferably comes with some examples or usages>",
        "tags": [<a list of tags, like "Term", "Feature", "Good-Practice", "Bad-Practice", "StorageTech Contraption">]
    },
    ...
]
```
* Once you are finised with writing your entry, you should select the full contents of the file with Ctrl+A, and copy paste it into a JSON validator like [JSONLint](https://jsonlint.com/) to verify that the JSON is formatted correctly.
* Once it is, then you can write a short commit message describing your additions (or changes), and select "Create a new branch for this commit and start a pull request."

If you are a dictionary curator, then you may merge pull requests of any additions or changes that you find satisfactory.

## Technical details
The project is hosted through GitHub Pages. It operates entirely clientside and is written in vanilla js, with [jQuery 3.6](https://jquery.com/) and [Bootstrap 3.3.7](https://getbootstrap.com/docs/3.3/) being used for the interface. Most icons used are from [Font Awesome](https://fontawesome.com/).