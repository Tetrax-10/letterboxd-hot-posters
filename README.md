# Letterboxd Hot Posters

A simple Node.js script that outputs a importable Letterboxd-list.csv containing films with hot posters from pages like [https://letterboxd.com/films/](https://letterboxd.com/films/country/philippines/) and [public lists](https://letterboxd.com/raghavan_rave/list/hot-posters-philippines/).

### Here is a [Letterboxd list](https://letterboxd.com/raghavan_rave/list/hot-posters-philippines/) I created with this tool.

![example-list.jpg](https://raw.githubusercontent.com/Tetrax-10/letterboxd-hot-posters/main/assets/example-list.jpg)

<br>

## Installation

1. Clone the repository: `git clone https://github.com/Tetrax-10/letterboxd-hot-posters.git`
2. Install dependencies: `npm install`

<br>

## Usage

The usage is very simple, there are only 4 steps.

#### 1. Scrapping

In this step the script scrapes all the film's link, id and poster url present in the given url page.

```powershell
npm run lhp -- --scrape --url "https://letterboxd.com/films/country/philippines/by/release/"
```

#### 2. Downloading scrapped posters

In this step the script downloads all the posters it scraped in the previous step.

```powershell
npm run lhp -- --download --url "https://letterboxd.com/films/country/philippines/by/release/"
```

#### 3. Classifying posters

In this step the script classifies all the posters it downloaded in the previous step.

_In layman terms:_ This is the process where it **ranks** the posters based on how **hot** 🔥 they are.

```powershell
npm run lhp -- --classify --url "https://letterboxd.com/films/country/philippines/by/release/"
```

#### 4. Creating CSV

In this step, the script creates a CSV file containing all the hot posters based on the weight you specified.

```powershell
npm run lhp -- --create-csv --url "https://letterboxd.com/films/country/philippines/by/release/"
```

In this step you can use two optional flags, `--manual` and `--weight`.

<table>
  <tr align="center">
    <td><b>args</b></td>
    <td><b>Description</b></td>
    <td><b>Default</b></td>
    <td><b>Type</b></td>
  </tr>
  <tr align="center">
    <td>--manual</td>
    <td align="left"><a href="#what-is-manual-poster-picker---manual">Use manual poster picker</a></td>
    <th colspan="2">present or not</th>
  </tr>
  <tr align="center">
    <td>--weight</td>
    <td align="left">Filter posters about a certain weight</td>
    <td>30</td>
    <td>number</td>
  </tr>
</table>

**Example**:

```powershell
npm run lhp -- --create-csv --manual --weight 60 --url "https://letterboxd.com/films/country/philippines/by/release/"
```

Now following these steps you will have a CSV file in the `out` folder. Now just import them as a list in Letterboxd.

<br>

## what is manual poster picker `--manual`?

Manual poster picker is a locally hosted web page that you can use to manually select posters that you feel are hot. It is useful when you have a less number of posters that you want to classify manually.

![manual-poster-picker.jpg](https://raw.githubusercontent.com/Tetrax-10/letterboxd-hot-posters/main/assets/manual-poster-picker.jpg)

<br>

## Credits

1. [GantMan/nsfw_model](https://github.com/GantMan/nsfw_model) - NSFW image classification model.
2. [infinitered/nsfwjs](https://github.com/infinitered/nsfwjs) - JS support for nsfw_model.

<br>

If you’re enjoying this tool, consider supporting its development by starring it on [GitHub](https://github.com/Tetrax-10/letterboxd-hot-posters) or making a [donation](https://github.com/sponsors/Tetrax-10).
