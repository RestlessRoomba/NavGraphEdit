# NavGraphEdit

NavGraphEdit ist ein browserbasiertes Werkzeug zur Erstellung und Bearbeitung von Routengraphen für die HSMW-Navigationsanwendung. Es unterstützt sowohl die Erstellung von Routennetzen für den Außenbereich als auch für die Indoor-Navigation innerhalb von Gebäuden.

Repository: https://github.com/RestlessRoomba/NavGraphEdit

## Voraussetzungen

Für die Nutzung von NavGraphEdit werden benötigt:

* ein moderner Webbrowser mit Unterstützung für JavaScript ES-Module, z. B. Firefox, Chromium oder Google Chrome
* ein lokaler Webserver zum Bereitstellen der Projektdateien
* eine Internetverbindung für die von Leaflet verwendeten Kartendaten im Outdoor-Modus

Es ist keine Installation von Node.js oder weiteren JavaScript-Paketen erforderlich. Die im Projekt enthaltene `package.json` wird für den Betrieb des Editors nicht benötigt.

Für den Outdoor-Modus werden Kartendaten von OpenStreetMap sowie ein Satellitenkarten-Layer von Esri verwendet.

## Einrichtung

Das Projekt kann über GitHub geklont werden:

```bash
git clone https://github.com/RestlessRoomba/NavGraphEdit.git
```

Alternativ kann das Repository als ZIP-Datei heruntergeladen und anschließend entpackt werden.

Die Projektstruktur enthält unter anderem:

```text
NavGraphEdit/
├── floorplans/
├── js/
├── index.html
├── style.css
├── package.json
└── README.md
```

Die Grundrisse für die Indoor-Navigation befinden sich im Verzeichnis `floorplans/`. Die Ordnerstruktur bildet dabei die Gebäude und deren Etagen ab.

## Starten der Anwendung

NavGraphEdit sollte über einen lokalen Webserver gesartet werden.

### Möglichkeit 1: VS Code / VSCodium Live Server

Das Projekt kann beispielsweise mit der Erweiterung **Live Preview** geöffnet werden.

1. Projektordner in VS Code oder VSCodium öffnen.
2. `index.html` rechtsklicken.
3. Mit der Funktion **"Show Preview"** starten.
4. Die vom Webserver bereitgestellte Adresse im Browser öffnen.

### Möglichkeit 2: Python

Falls Python 3 installiert ist, kann aus dem Projektverzeichnis ein einfacher lokaler Webserver gestartet werden:

```bash
python3 -m http.server 8000
```

Danach im Browser öffnen:

```text
http://localhost:8000
```

## Zugangsdaten und Konfiguration

NavGraphEdit benötigt keine Benutzerkonten, Passwörter oder API-Schlüssel.

Die Anwendung verwendet externe Kartendienste für den Outdoor-Modus. Dafür ist eine Internetverbindung erforderlich.

Die Indoor-Karten werden aus den lokalen Dateien im Verzeichnis `floorplans/` geladen.

## Bedienung

### Outdoor-Modus

Im Outdoor-Modus wird eine interaktive Karte des Campus angezeigt.

Über die Toolbar stehen unter anderem folgende Funktionen zur Verfügung:

* **Select** – vorhandene Nodes oder Edges auswählen
* **Node** – neue Nodes auf der Karte erstellen
* **Edge** – zwei verschiedene Nodes miteinander verbinden
* **Export** – den aktuellen Routengraph als JSON-Datei exportieren
* **Load** – eine vorhandene JSON-Datei importieren

Über das Layer-Menü der Karte kann zwischen der normalen Kartenansicht und der Satellitenansicht gewechselt werden.

### Nodes

Nodes stellen Positionen innerhalb des Routennetzes dar.

Mit dem Node-Werkzeug können neue Nodes platziert werden. Im Select-Modus können vorhandene Nodes ausgewählt und bearbeitet werden.

Nodes besitzen eine eindeutige UUID und können zusätzliche Tags beziehungsweise Namen enthalten. Diese Informationen können später von der mobilen Navigationsanwendung für Suchfunktionen verwendet werden.

Nodes können im Select-Modus mit gedrückter `Strg`-Taste verschoben werden.

### Edges

Edges verbinden zwei Nodes miteinander und stellen mögliche Wege im Routengraphen dar.

Beim Erstellen einer Edge wird ihre Gewichtung automatisch aus der Entfernung zwischen den verbundenen Nodes berechnet.

Für Edges kann außerdem festgelegt werden, ob der entsprechende Weg für Rollstuhlfahrer geeignet ist.

Über **Split Edge** kann eine bestehende Edge in der Mitte geteilt werden. Dabei wird automatisch ein neuer Node erzeugt und die ursprüngliche Edge durch zwei neue Edges ersetzt.

### Indoor-Modus

Über die  **Indoor** und **Outdoor** Buttons kann zwischen dem Außenbereich und der Indoor-Navigation gewechselt werden.

Im Indoor-Modus kann zunächst ein Gebäude ausgewählt werden. Anschließend kann über die Etagensteuerung zwischen den vorhandenen Etagen gewechselt werden.

Für jede Gebäude-/Etagenkombination wird der entsprechende Grundriss aus dem Verzeichnis `floorplans/` geladen. Auf dem Grundriss können Nodes und Edges auf dieselbe Weise erstellt und bearbeitet werden wie im Outdoor-Modus.

Indoor-Nodes verwenden Koordinaten relativ zum jeweiligen Grundriss.

### Portal Edges

Portal Edges ermöglichen die logische Verbindung von Indoor- und Outdoor-Routennetzen.

Sie werden verwendet, um beispielsweise einen Gebäudeeingang auf der Outdoor-Karte mit dem entsprechenden Punkt auf dem Grundriss des Gebäudes zu verbinden.

Dadurch können später Outdoor- und Indoor-Routen zu einer zusammenhängenden Route kombiniert werden.

Portal Edges können über das Info Panel von Nodes erstellt werden. Bestehende Portal Edges werden im Portal Edge Menu gelistet und können dort um zusätzliche Informationen (Name, Gewicht, Rollstuhlzugänglichkeit) ergänzt werden.


## Import und Export

Über **Export** wird der aktuelle Routengraph als JSON-Datei gespeichert.

Die JSON-Datei enthält neben den Metadaten die Outdoor- und Indoor-Routendaten. Dazu gehören unter anderem:

* Nodes
* Edges
* Node-Tags
* Edge-Gewichte
* Rollstuhlzugänglichkeit
* Gebäude
* Etagen
* Grundrissinformationen
* Versionsinformationen

Die exportierte Datei kann anschließend mit **Load** wieder in NavGraphEdit geladen und weiterbearbeitet werden.

Das Tool unterstützt außerdem ältere JSON-Dateien. Beim erneuten Export werden diese in das aktuelle Datenformat überführt, wobei vorhandene Routendaten erhalten bleiben.

## Versionsverwaltung der Routendaten

Die JSON-Dateien enthalten eine Versionsnummer für den Routengraphen sowie eine Schema-Version.

Die Graph-Version kann über die Versionssteuerung in der Toolbar verändert werden.

Die Schema-Version beschreibt dagegen die Struktur des JSON-Formats und wird nur geändert, wenn sich das zugrunde liegende Datenmodell wesentlich verändert.

## Test der wichtigsten Funktionen

Nach dem Start kann die grundlegende Funktionalität mit folgendem Testablauf überprüft werden.

### Outdoor-Test

1. **Outdoor** auswählen.
2. **Node** auswählen.
3. Mehrere Nodes auf der Karte platzieren.
4. **Edge** auswählen.
5. Zwei Nodes miteinander verbinden.
6. Eine Node im Select-Modus mit gedrückter `Strg`-Taste verschieben.
7. Überprüfen, dass sich die angeschlossene Edge entsprechend anpasst.
8. Eine Edge auswählen und die Eigenschaft **Wheelchair accessible** verändern.
9. Eine Edge über **Split Edge** teilen.
10. Eine Node oder Edge auswählen und löschen.

### Indoor-Test

1. **Indoor** auswählen.
2. Ein Gebäude über das Dropdown-Menü auswählen.
3. Über die Etagensteuerung zwischen mehreren vorhandenen Etagen wechseln.
4. Auf einer Etage Nodes und Edges erstellen.
5. Eine Node verschieben und überprüfen, dass verbundene Edges aktualisiert werden.
6. Auf eine andere Etage wechseln.
7. Wieder zur ursprünglichen Etage wechseln und überprüfen, dass die zuvor erstellten Daten erhalten geblieben sind.
8. Zu einem anderen Gebäude wechseln und überprüfen, dass dessen eigener Grundriss und Routengraph geladen werden.

### Import-/Export-Test

1. Einen kleinen Outdoor-Routengraphen erstellen.
2. Einige Indoor-Nodes und Edges erstellen.
3. Portal-Edges zwischen Outdoor und Indoor (oder zwischen Etagen) erstellen
4. Die Daten über **Export** als JSON-Datei speichern.
5. Die Anwendung neu laden.
6. Die zuvor exportierte JSON-Datei über **Load** importieren.
7. Überprüfen, dass Outdoor- und Indoor-Daten vollständig wiederhergestellt wurden.
8. Überprüfen, ob Portal Edges korrekt im Portal Edge Menu erscheinen.

## Grundrisse hinzufügen

Neue Grundrisse können im Verzeichnis `floorplans/` ergänzt werden.

Die Ordnerstruktur muss der im Projekt verwendeten Gebäude- und Etagenstruktur entsprechen. Die jeweilige Etage wird über die konfigurierte Gebäude-/Etagenstruktur der Anwendung mit dem entsprechenden Bild verknüpft.

Beim Hinzufügen neuer Gebäude oder Etagen müssen daher sowohl die Grundrissdateien als auch die entsprechende Konfiguration in der Anwendung angepasst werden.

## Weiterentwicklung

Bei Änderungen am JSON-Datenmodell sollte insbesondere die Schema-Version berücksichtigt werden.

Neue Funktionen sollten möglichst so integriert werden, dass bestehende Outdoor- und Indoor-Daten weiterhin importiert und bearbeitet werden können. Änderungen am Import- und Exportverhalten sollten außerdem mit bestehenden und älteren JSON-Dateien getestet werden.

Bei der Erweiterung um neue Gebäude oder Etagen müssen die zugehörigen Grundrissdateien und die Konfiguration der Indoor-Struktur gemeinsam angepasst werden.
