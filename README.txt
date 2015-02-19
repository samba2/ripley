
===================================
R I P L E Y - A Modest PLC-Emulator
===================================


Inhalt:

  1.   Einleitung
  2.   Aufbau
  3.   Aufruf
  4.   Konfigurationsdatei im YAML-Format
  5.   Konfigurations-Parameter
  6.   Telegrammdefinition und Variablen
  7.   Buffer Variablen
  8.   Externe Variablen
  9.   Weboberfläche
 10.   Glossar
 11.   Tipps & Tricks 


=============
1. Einleitung
=============

Ripley ist ein einfacher Steuerungsemulator der mit einem Production Control 
System (PCS) kommuniziert. 

Ripley ermöglicht eine verkürzte, zeitlich unabhängige Inbetriebnahme von Kopplungen
zwischen PCS und Anlagensteuerung. Dies wird erreicht in dem die Konfiguration 
und Parametrierung auf PCS Seite im Vorfeld bereits ausgiebig mit Ripley 
entwickelt, getestet und korrigiert werden kann.

Am Ende dieses Prozesses steht eine stabile Konfiguration auf PCS Seite mit
der dann die tatsächlichen Anlagensteuerung gekoppelt wird.

Ripley bezieht sein Emulationsmodell aus einer einfach strukturierten
Konfigurationsdatei. Zum Erstellen bzw. Ändern dieser Datei sind keine speziellen 
Programmierkentnisse notwendig.

Es ist problemlos möglich mehrere Ripley Instanzen parallel auf einem System
laufen zu lassen. Damit lassen sich auch komplexe Produktionsumgebungen
mit gleichzeitiger Kommunikation zu mehreren Anlagensteuerungen nachstellen
und testen.


=========
2. Aufbau
=========

Diese Übersichtsgrafik zeigt den prinzipiellen Aufbau der Software.
Abhängig von seiner Konfiguration verbindet sich Ripley nach dem
Anwendungsstart mit dem PCS oder wartet auf eine eingehende
Verbindung des PCS.

Sobald die Verbindung steht, beginnt Ripley mit der Emulation.

Zur Echtzeit-Visualisierung der Emulation greift ein Webbrowser auf den
in Ripley integrierten Web Server zu.

                          +--------------+
                          |              |
   +------------+         |    Ripley    |
   |            |         |              |         +---------------+
   | Production |         |   +----------|         |               |
   | Control    |         |   |integrated|         |    GUI in     |
   | System     |<------->|   |web-server|<------->|  web browser  |
   |            |         |   +----------|         |               |
   +------------+         +--------------+         +---------------+


=========
3. Aufruf
=========

Abhängig vom Betriebsystem wird Ripley über folgende Startdateien aufgerufen:
  - ripley.sh  - Linux
  - ripley.bat - Windows

  
Einfacher Aufruf
================

ripley.sh konfigurationsdatei_im_yaml_format


Optionen
========

Momentan ist nur die Option "verbose" implementiert. Damit wird die Menge
der auf der Konsole und über das Web-Interface ("Log") ausgegebenen Daten
eingestellt.

Es gibt vier verbose-Level wobei "4" der Höchste ist.

Beispiel, Aufruf mit höchstem Logging-Level:

ripley.sh verbose=4 konfigurationsdatei_im_yaml_format  

Wird die Option "verbose" nicht angegeben, wird standardmäßig
"verbose=1" genutzt.


=====================================
4. Konfigurationsdatei im YAML-Format
=====================================

Die Konfiguration von Ripley ist im "YAML Ain't Markup Language" (YAML) Format
realisiert. Dieses Format legt besonderen Wert auf die Lesbarkeit mit dem
menschlichen Auge. 

Das YAML-Format sowie der eingesetzte Parser setzen folgende Bedingungen für
das erstellen einer gültigen Ripley-Konfigurationsdatei voraus:

  - in der ersten Zeile der Konfigurationsdatei steht die Zeichenkette "---"
    als Kennzeichen für einen neuen YAML-Datenblock
  - als Einrückungen werden immer Leerzeichen, keine Tabulatoren verwendet
  - empfohlen sind vier Leerzeichen als Einrückung

  
Grundsätzliche Struktur
=======================

Eine Ripley-Konfiguration hat folgende grundsätzliche Struktur:

            Konfiguration                   |             Beschreibung
--------------------------------------------+-----------------------------------------
---                                         | erste Zeile, Beginn eines YAML-Dokuments
    globale Parameter                       | mehrere globale Emulationsparameter
    events:                                 | Sammel-Objekt für Ripley-Events
        ersterEvent:                        | Name des ersten Events
            Event Parameter                 | Event spezifische Konfigurationsparameter
            actions:                        | beinhaltet die einzelnen Aktionen 
                                            | eines Events. Aktuell werden ab hier 
                                            | die Telegramme und ggf. extern aufzurufende 
                                            | Programme definiert.
                erstesTelegrammErsterEvent: | Telegramm-Name
                    run:                    | optional, Programm(e), die vor der Telegramm-Defintion 
                                            | aufgerufen werden sollen. 
                    telegram:               | Telegramm-Definition


Eine Beschreibung der möglichen globalen und Event spezifischen Konfigurationsparameter 
ist im nächsten Abschnitt zu finden.

Ein guter Start für eine eigene Ripley Konfiguration sind die Beispiele
im Verzeichnis "examples".


===========================
5. Konfigurations-Parameter
===========================

Wie im vorherigen Abschnitt beschrieben, interpretiert Ripley globale und Event spezifische
Konfigruations-Parameter. Details sind in der folgenden Tabelle beschrieben.


      Schlüsselwort      |                 Beschreibung                                 |   Mögliche Werte     |   Verwendung
-------------------------+--------------------------------------------------------------+----------------------+------------------

connectionType               Soll Ripley die Verbindung zum PCS aufbauen ("active")        active/ passive        global
                             oder wartet Ripley auf eingehende Verbindungen ("passive") 

destinationHost              bei connectionType "active" Zieladresse des PCS               Hostname/ IP-Adresse   global

port                         Port zu dem Ripley eine Verbindung auf "destinationHost"      gültige Portnummer     global  
                             aufbauen soll oder Port auf dem Ripley auf eingehende
                             Verbindungen wartet (connectionType "passive")

cycleTime                    Nur für Events mit direction "send". Wie lange soll Ripley    Zeit in Sekunden       global. Wenn im Event
                             warten bis erneut versucht wird ein Telegramm zu senden.                             definiert wird globaler
                             "cylceTime" simuliert im Zusammenspiel mit "status" und                              Wert überschrieben.
                             "previousStatus" die Taktung einer Produktionsstraße.

sessionTimeout               Definiert für ein versendetes Telegramm die Größe des         Zeit in Sekunden       global
                             Zeitfensters die Ripley auf ein Antwort-Telegramm wartet.

dateFormat                   Definiert das Format des Datums-Strings für die interne       siehe Abschnitt        global
                             Variable ${ripley_date}                                       "Ripley interne 
                                                                                           Variablen"

timeFormat                   Definiert das Format des Zeit-Strings für die interne         siehe Abschnitt        global
                             Variable ${ripley_time}                                       "Ripley interne
                                                                                           Variablen"

bufferKey                    Buffervariable mit zusätzlicher Funktion. Die Datenablage     gültige Buffer         global
                             von empfangenen Telegramm-Informationen im Buffer geschieht   Variable
                             unter dem jeweiligen Wert der bufferKey Variable.
                             Zu sendende Telegramme greifen über den Wert der in
                             bufferKey definierten Buffervariable auf Werte im Buffer zu.
                             Siehe auch "7. Buffer Variablen"

externalDatasource           Definiert ein- oder mehrere externe Datenquellen. Diese       Ripley-Name der        global
                             können vor dem Zusammenstellen und Senden eines Telegramms    Datenquelle :
                             aufgerufen werden. Das Ergebnis des Programm-Aufrufs          Pfad des externen
                             steht dann beim Zusammenstellen des Telegramms als            Programms
                             Variable zur Verfügung.

events                       Globaler Konfigurationsknoten unter dem alle Events der       "events"               global
                             Emulations-Konfiguration abgespeichert werden.

description                  Beschreibung des Events                                       Text                   Event

direction                    Richtung des Events.                                          "receive"/ "send"      Event
                             "receive" bedeutet, dass Ripley bei diesem Event auf den 
                             Empfang des ersten Telegramms des Events wartet. Der 
                             Emulator selbst wird nie allein ein "receive" Event 
                             auslösen.
                             "send" schickt das erste Telegramm des Events an das PCS.
                             Dies geschieht beim Start, beim Ablauf der "cycleTime" 
                             und beim manuellen Klick auf den ">>" - Button in der
                             GUI.
                             
status                       Definiert einen Status für den Event. Dies hat Auswirkungen   Text                   Event
                             auf das Speichern von empfangenen Daten im Buffer sowie
                             auf der Verkettung von Events mittels "status" und
                             "previousStatus"

previousStatus               Verknüpft ein Event mit seinem logischen Vorgänger-Event.     Text                   Event
                             Wenn innerhalb des Events ein Telegramm mit Buffer Variablen
                             versendet werden soll und dieses Telegramm keine Antwort auf
                             ein soeben erhaltenes Telegramm ist, stellt "previousStatus"
                             eine zweite Quelle für zu versendende Daten dar.
                             Dabei wird versucht den Eintrag mit dem ältesten Vorgänger-
                             status ("status time") als Datenquelle zu ermitteln.
                             Nach Versenden des Telegramms wird dieser Eintrag dann auch
                             in den aktuellen "status" gebucht. Damit simuliert Ripley
                             eine einfache Taktstraßenverknüpfung.
                             
stopSendingOnStatusMaxAmount Für "send" Event. Sende keine Telegramme mehr für dieses      Maximalanzahl          Event
                             Event wenn der Zähler von "stopSendingOnStatusMaxAmount"
                             überschritten wurde. Simuliert eine maximale Puffergröße
                             einer PLC.

removeBufferEntriesOfStatus  Wenn dieser Parameter für ein Event konfiguriert ist,         Text                   Event
                             werden, wenn das Event ausgelöst wird, alle Buffer Einträge 
                             mit dem hier definierten Status gelöscht. 
                             Parameter wird zum Simulieren von "Puffer löschen" Aktionen
                             an der PLC genutzt.
                             
maxEntriesOfStatusInBuffer   Ein Event mit diesem Parameter behält nur die letzten         maximale Anzahl        Event
                             "maxEntriesOfStatusInBuffer" Einträge für den "status"
                             des Events im Buffer. Damit werden am Ende einer Taktstraße
                             Daten aus Ripley entfernt.
                             
onlySendOnGuiTrigger         Nur für "send" Event. Weder der Start von Ripley noch das     "true"                 Event
                             Verstreichen der "cycleTime" lösen den Event aus. Allein
                             der ">>" - Button in der GUI (Overview) kann den Event
                             triggern.

actions                      Ein Event besteht aus mindestens einer Aktion. Der            "actions"              Event
                             Konfigurationsknoten "actions" sammelt diese einzelnen 
                             Aktionen.

run                          Für "send" Event. Bevor ein Telegramm gesendet wird, kann     Liste der aufzu-       Event
                             man hier ein in externalDatasource definiertes externes       rufenden Daten-
                             Programm aufgerufen werden. Die Ergebnisse des                quellen sowie
                             Aufrufs stehen dann auch für die folgende Telegramm-          deren Argumente
                             Definition zur Verfügung.

telegram                     Beinhaltet die Telegramm-Definition einer einzelnen Aktion.   Telegramm-             Event
                             Aktuell ist "telegram" der einzige Konfigurationsparameter    definition
                             innerhalb einer Aktion.


====================================
6. Telegrammdefinition und Variablen
====================================

Ripley erlaubt in der Telegramm-Definition (Value-Spalte) die Benutzung 
von Variablen. Dabei haben die Variablen grundsätzlich eine Form von

${variablen_name} 


Variablen-Typen
===============

Ripley kennt vier Typen von Variablen:
  - Ripley interne Variablen
  - "Direkte Antwort" Variablen 
  - Externe Variablen
  - Buffer Variablen


Ripley interne Variablen
========================

Ripley interne Variablen werden von Ripley selbst generiert und können in 
zu sendenden Telegrammen verwendet werden. Der Emulator erkennt interne 
Variablen an folgendem Muster: ${ripley_*}

Aktuell unterstützt Ripley folgende interne Variablen:
  - ${ripley_date} - aktuelles Datum
  - ${ripley_time} - aktuelle Zeit
  - ${ripley_random_PATTERN} - nach PATTERN-Muster genierierter Zufallswert


Date- und Time Variablen
------------------------

Das Format dieser beiden Variablen wird über die globalen Parameter
"dateFormat" sowie "timeFormat" vorgegeben. Details zu unterstützten 
Platzhaltern findet man unter: http://code.google.com/p/datejs/


Beispiel dateFormat
-------------------

dateFormat: yyyyMMdd
...
    telegram:
        #  Offset|Lng|  Value    |      Comment   
        # ------------------------------------------------
        - [  1,     8, "${ripley_date}"        ]
        - [  9,     4, "DONE"                  ]

Im PCS wird folgender String empfangen:
>>>20120329DONE<<<


Random Variable
---------------

Die Random-Variable ermöglicht das Versenden eines zufällig generierten
Strings dessen Format direkt in der Variablendefinition mit angegeben
wird. 

Um zu gewährleisten, dass der errechnete Zufalls-String nicht mit anderen 
bereits existierenden Variablen im Buffer kollidiert, vergleicht Ripley 
vor dem Aussenden den Inhalt der errechneten Random Variable mit dem 
kompletten Buffer Inhalt. 
Sollte sich im Buffer bereits ein identischer Wert befinden, generiert 
Ripley erneut einen Random String und vergleicht ihn wieder mit dem 
Buffer Inhalt. 
Dieser Zyklus wird maximal 10 mal durchgeführt. Bei den meisten Emulationen
sollte so eine wirklich neue, eindeutige Zufallsvariable gefunden werden.

Folgende Format-Möglichkeiten existieren bei der Definition einer 
Random Variable:

  - a - kleiner Buchstabe von a-z
  - A - großer Buchstabe von A-Z
  - 0 - Ziffer von 0-9


Beispiel Random Variable  
------------------------

...
    telegram:
        #  Offset|Lng|  Value    |      Comment   
        # ------------------------------------------------
        - [  1,     8, "${ripley_random_AA00aaaa}"     ]
        - [  9,     4, "DONE"                          ]

Im PCS könnte z.B. folgender String empfangen werden:
>>>VS46rnbdDONE<<<


"Direkte Antwort" Variablen
===========================

"Direkte Antwort" Variablen schneiden einen Wert aus einem empfangenen Telegramm aus
und stellen diesen Wert dem darauf folgendem Sende-Telegramm wieder zur Verfügung.

Außer dem direkt folgenden Sendetelegramm kann keine weitere Aktion auf den
Wert der "Direkte Antwort" Variable zugreifen.

Dieser Variablen-Typ wurde implementiert um zum Beispiel auf eine einfache Art
eine Transaktions-Kennung oder Session-ID an das PCS zurückzusenden.

Die Variablen-Namen können frei gewählt werden mit Außnahme von:
  - ${ripley_*} (Ripley interne Variable)
  - ${buffer_*}  (Buffer Variable)

Beispiel:

Auszug aus der Emulator-Konfiguration:
events:
    receiveEvent:
        description: simple receive event
        direction: "receive" 
        actions:
            receiveTeleg:
                telegram:
                    #  Offset|Lng|  Value    |      Comment   
                    # ------------------------------------------------
                    - [  1,    12, "MY_WEIGHT_IS"                    ]
                    - [ 13,     4, "${weight}"                       ]
            sendReceipt:
                telegram:
                    #  Offset|Lng|  Value    |      Comment   
                    # ------------------------------------------------
                    - [  1,    14, "YOUR_WEIGHT_IS"                 ]
                    - [ 15,     4, "${weight}"                      ]

Ein Telegramm 
>>>MY_WEIGHT_IS80kg<<< 

wird von Ripley mit 
>>>YOUR_WEIGHT_IS80kg<<< 

beantwortet.

Die mächtigste Form der Variablen sind die Buffer Variablen die im nächsten
Abschnitt erläutert werden.




===================
7. Buffer Variablen
===================

Buffer Variablen schneiden wie die "Direkte Antwort" Variablen einen Wert aus
einem empfangenen Telegramm aus. Allerdings wird dieser Wert in einen 
speziellen Speicherbereich des Emulators, dem Buffer, abgelegt. Sende-
und Empfangstelegramme der gesamten Emulation können dann auf die im Buffer 
abgelegten Werte zugreifen.

Der Emulator erkennt Buffer Variablen in der Telegramm-Konfiguration am 
Muster ${buffer_*}


Zugriffslogik
=============

Abhängig von ihrer Definition in der Emulator-Konfiguration können Telegramme
entweder Sende- oder Empfangsseitig zum Einsatz kommen.

Dabei gilt folgende grundätzliche Zugrifflogik:
  - Verwenden von Buffer Variablen in einem Empfangs-Telegramm = Schreiben in den Buffer
  - Verwenden von Buffer Variablen in einem Sende-Telegramm = Lesen aus dem Buffer

Das Ablegen der Variablen im Buffer wird durch den Buffer Key organisiert.


Buffer Key
==========

Der Buffer Key ist eine Buffervariable mit einer zusätzlichen Funktion. Beim Empfang
von Daten dient er als Schlüssel zur Datenablage im Buffer. Dabei kommt es
zu folgendem grundsätzlichen Ablauf:

  - Ein Telegramm mit definierten Buffer Variablen wird vom PCS empfangen.
  - Ripley sucht die Variable, die zum Ablegen der Daten als Schlüssel dienen soll.
  - Dafür liest Ripley den globalen Parameter "bufferKey" aus.
  - "bufferKey" beinhaltet den Namen der Buffervariable, die den Wert für den
    Ablageschlüssel der empfangenen Daten im Buffer enthalten soll.
  - Ripley liest den Wert der bufferKey Variable im Telegramm aus und speichert
    die weiteren Buffervariablen im Buffer unterhalb des Werts der bufferKey
    Variable ab.

Voraussetzung: Bei der Benutzung von Buffer Variablen muss ein gültiger bufferKey
               definiert sein. D.h. die Variable die im globalen Parameter "bufferKey"
               ablegt ist, muss in jeder Ripley-Telegramm-Definition vorkommen die
               mit Buffer Variablen arbeitet.                
               Dies wird von Ripley beim Programmstart überprüft.

Beispiel
--------

bufferKey: "${buffer_bicycleNo}"
...
events:
    receiveEvent:
        description: buffer receive event
        direction: "receive" 
        actions:
            receiveTeleg:
                telegram:
                    #  Offset|Lng|  Value    |      Comment   
                    # ------------------------------------------------
                    - [  1,     6, "BIKENO"                      ]
                    - [  7,     8, "${buffer_bicycleNo}"         ]
                    - [ 15,    10, "${buffer_bicycleColor}"      ]
                    - [ 25,     4, "${buffer_bicycleWeight}"     ]
                    - [ 29,     4, "${buffer_bicycleGears}"      ]
            responseTeleg:
                telegram:
                    #  Offset|Lng|  Value    |      Comment   
                    # ------------------------------------------------
                    - [  1,    16, "RESPONSE_TO_BIKE"            ]
                    - [ 17,     8, "${buffer_bicycleNo}"         ]
                    - [ 25,     8, "COLOR_IS"                    ]
                    - [ 33,    10, "${buffer_bicycleColor}"      ]
                    - [ 43,     9, "WEIGHT_IS"                   ]
                    - [ 42,     4, "${buffer_bicycleWeight}"     ]
                    - [ 46,     9, "GEARS_ARE"                   ]                    
                    - [ 55,     4, "${buffer_bicycleGears}"      ]

                    
Durch den Buffer Key "${buffer_bicycleNo}" ergibt sich folgende prinzipielle 
Struktur im Buffer:

${buffer_bicycleNo} -+                 
                     |-> ${buffer_bicycleColor}
                     |-> {buffer_bicycleWeight}
                     --> ${buffer_bicycleGears}
                     
Ein empfangenes Telegramm (action "receiveTeleg")
>>>BIKENO00000001GREEN     12KG   8<<< 

wird von Ripley mit folgenden effektiven Daten im Buffer abgelegt:

00000001 -+
          |-> bicycleColor: "GREEN     "
          |-> bicycleWeight: 12KG
          --> bicycleGears: "   8"

Da der Event "receiveEvent" auf das Empfangstelegramm "receiveTeleg" das 
Folgetelegramm "responseTeleg" defniert hat, versendet Ripley sofort folgendes
Antwort-Telegramm mit Daten aus dem Buffer:

>>>RESPONSE_TO_BIKE00000001COLOR_ISGREEN     WEIGHT_IS12KGGEARS_ARE   8<<<


Aktuell werden von Ripley die empfangenen Daten unverändert im Speicher abgelegt.
Ein entfernen von Leerzeichen (trim) erfolgt nicht.                         


Quelle der Buffer Key Variable
==============================

Wenn ein zu sendendes Telegramm gültige Buffervariablen enthält (d.h. mindestens
die als Buffer Key definierte Variable) nutzt Ripley hintereinander zwei 
Varianten den tatsächlichen Schlüssel zu finden mit dem dann im Buffer
nach passenden Daten gesucht wird:
  - 1ter Test: direktes Voränger-Empfangstelegramm im Event benutzte auch 
               Buffer Variablen
  - 2ter Test: Event hat einen "previousStatus" definiert
  
  
Vorgänger-Empfangstelegramm mit Buffer Variablen
------------------------------------------------

In diesem einfacheren Fall nimmt Ripley einfach den Wert des gerade eben empfangenen
Buffer Keys, greift damit auf den Buffer zu und füllt damit das Sendetelegramm. 

Dies ist im letzten Beispiel zu sehen:
Das Empfangstelegramm "receiveTeleg" empfängt Daten die unter dem Wert 
"00000001" ( ${buffer_bicycleNo} ) abgelegt werden. Das im gleichen Event folgende Telegramm
"responseTeleg" füllt seine Felder mit den Daten die im Buffer für bicycleNo "00000001"
wurden.

Diese Verknüpfung von aufeinanderfolgenden Telegrammen und dem Buffer ist 
unabhängig von eventuellen Statuswerten des Events. Die als nächstes beschriebene
Methode bezieht den Wert für den Zugriff auf den Buffer nicht aus dem Vorgängertelegramm
sondern von den Buffereinträgen des Vorgängerstatus.

  
Event mit "previousStatus"
--------------------------

Mit der hier beschriebenen Methode ist es auf einfache Weise möglich einen 
verknüpften Produktionsablauf zu simulieren. Dabei wird einem Event ein Status
zugeordnet. Dieser Status gilt nur für diesen Event.

Einem darauf folgendem Arbeitsschritt ordnet man ebenfalls einen Status zu. 
Dann verknüpft man den aktuellen Arbeitschritt mit dem vorherigen Arbeitsschritt
mittels des Event-Parameters "previousStatus".


Beispielkonfiguration mit "previousStatus" für eine Fahrrardfabrik
------------------------------------------------------------------

Beim Zusammenbau eines Fahrrads fallen folgende drei prinzipiellen Arbeitschritte an:

  - Einzelmontagen am Rahmen (Licht, Bremse, etc) - Montagestart, Status A1
  - Rädermontage, Status A2
  - Fahrtest - Montageende, Status A3
  
Eine einfache Kommunikation der Anlagensteuerung der Fahrradmontage mit dem PCS 
könnte folgende Schritte beinhalten:
  
  1. Anfordern eines neuen Fahrrad-Montageauftrags ( Status A0 )
  2. Statusmeldung "Start Einzelmontagen" ( Status A1 )
  3. Statusmeldung "Start Rädermontage" ( Status A2 )
  4. Statusmeldung "Start Fahrtest" ( Status A3 )
  
Die entsprechende Ripley-Konfiguration dafür ist:

---
    connectionType: "active"
    destinationHost: "pcshost"
    description: "Bicycle Line"
    port: 12001 
    httpPort: 10119  
    cycleTime: 30   
    dateFormat: yyyyMMdd
    timeFormat: HHmmss
    bufferKey: "${buffer_bicycleNo}"
    events:
        fillPlcBuffer:
            description: fill buffer
            direction: "send" 
            status: "A0"
            stopSendingOnStatusMaxAmount: 3
            actions:
                sndRequestTeleg:
                    telegram:
                        #  Offset|Lng|  Value    |      Comment   
                        # ------------------------------------------------
                        - [  1,    16, "REQUEST_NEW_BIKE"               ] 
                rcvBufferData:
                    telegram:
                        #  Offset|Lng|  Value    |      Comment   
                        # ------------------------------------------------
                        - [  1,     8, "ANSWER  "                       ] 
                        - [  9,     8, "${buffer_bicycleNo}"            ]
                        - [ 17,    10, "${buffer_bicycleColor}"         ]
                        - [ 27,     4, "${buffer_bicycleWeight}"        ]
                        - [ 31,     4, "${buffer_bicycleGears}"         ]
        sendStatusAssemlyStart:
            description: start assembling single parts
            direction: "send" 
            status: "A1"
            previousStatus: "A0"
            cycleTime: 60
            actions:
                sndStatusTeleg:
                    telegram:
                        #  Offset|Lng|  Value    |      Comment   
                        # ------------------------------------------------
                        - [  1,    13, "BIKENO"                         ]
                        - [ 14,     8, "${buffer_bicycleNo}"            ]
                        - [ 22,     9, "STATUS_A1"                      ]
        sendStatusWheelsAssemlyStart:
            description: start assembling wheels
            direction: "send" 
            status: "A2"
            previousStatus: "A1"
            cycleTime: 40
            actions:
                sndStatusTeleg:
                    telegram:
                        #  Offset|Lng|  Value    |      Comment   
                        # ------------------------------------------------
                        - [  1,    13, "BIKENO"                         ]
                        - [ 14,     8, "${buffer_bicycleNo}"            ]
                        - [ 22,     9, "STATUS_A2"                      ]
        sendStatusAssemlyEnd:
            description: start cycle test, assembly end
            direction: "send" 
            status: "A3"
            previousStatus: "A2"
            cycleTime: 50
            maxEntriesOfStatusInBuffer: 5
            actions:
                sndStatusTeleg:
                    telegram:
                        #  Offset|Lng|  Value    |      Comment   
                        # ------------------------------------------------
                        - [  1,    13, "BIKENO"                         ]
                        - [ 14,     8, "${buffer_bicycleNo}"            ]
                        - [ 22,     9, "STATUS_A2"                      ]


Erklärung Event "fillPlcBuffer"
...............................

Ripley versucht beim Starten eine Verbindung zum Host "pcshost" auf Port 12001
aufzubauen. Glückt dies, versendet Ripley an "pcshost" das Telegramm "sndRequestTeleg"
mit dem Inhalt:

>>>REQUEST_NEW_BIKE<<<

Die Gegenseite antwortet mit neuen Daten für die Montage eines Fahrrads im Telegramm
"rcvBufferData". Ripley erkennt ein Telegramm durch den Vergleich der fixen Anteile
eines Empfangstelegramms mit dem empfangenen String.
Zusätzlich zu den empfangenen Daten wird automatisch noch der aktuelle Status 
sowie den Änderungszeitstempel des Datensatzes abgespeichert.

Die grundsätzliche Buffer Struktur sieht also wie folgt aus:

${buffer_bicycleNo} -+                 
                     |-> ${buffer_bicycleColor}
                     |-> {buffer_bicycleWeight}
                     |-> ${buffer_bicycleGears}
                     |-> Status
                     --> Empfangszeitstempel
                     
Ein Antwort Telegramm von "pcshost" mit dem Inhalt:

>>>ANSWER  00000001GREEN     12KG   8<<<

wird im Buffer im Buffer abgelegt:

00000001 -+
          |-> bicycleColor: "GREEN     "
          |-> bicycleWeight: 12KG
          |-> bicycleGears: "   8"
          --> status: A0
          --> status timestamp: 20120409195200

Wie man sieht, speichert Ripley zu den empfangenen Daten zusätzlich noch den
Status des Events sowie den Änderungszeitstempel dazu.

Um die Buffer-Größe von Ripley zu begrenzen wird im Event "fillPlcBuffer" noch 
der Parameter "stopSendingOnStatusMaxAmount: 3" definiert. Das bedeutet, dass
Ripley aufhört das Telegramm "sndRequestTeleg" zu senden sobald sich drei Einträge
mit Status "A0" im Buffer befinden. Verringert sich die Anzahl wird Ripley beim
nächsten Ablauf der "cycleTime" erneut "sndRequestTeleg" versenden.


cycleTime:

Die "cycleTime" gibt an wie oft versucht wird ein "send" - Event auszuführen. 
Die "cycleTime" wird in Sekunden definiert und kann gar nicht ( interner 
Standardwert 30 Sekunden), global oder pro Event definiert werden. Falls 
die "cycleTime" sowohl global als auch im Event vorhanden ist, gilt die 
Event-cycleTime.

Da weder im Event "fillPlcBuffer" noch global der Parameter "cycleTime" gesetzt 
ist, erfolgt die nächste Aussendung des Request-Telegramms nach Ablauf der 
Ripley-Standard cycleTime von 30 Sekunden.
              
In der Beispielkonfiguration wird die "cycleTime" der einzelnen Events zum 
Simulieren der Taktzeit der einzelnen Arbeitschritte genutzt.


Erklärung Event "sendStatusAssemlyStart"
........................................

Da es sich bei diesem Event um ein "send" Ereignis handelt ( direction: "send" )
wird als erstes versucht beim Starten von Ripley das Telegramm "sndStatusTeleg"
zu senden. Da das Telegramm Buffer Variablen benutzt, versucht Ripley einen 
gültigen Wert für den Buffer Key ${buffer_bicycleNo} zu finden.

Da "sndStatusTeleg" das erste Telegramm in diesem Event ist, kann der Wert 
nicht über das direkt davor empfangene Telegramm dieses Events abgeleitet werden.

Stattdessen findet Ripley aber den Verweis auf den Vorgängerstatus dieses Events
im Parameter "previousStatus: "A0"". 

Jetzt sucht Ripley im Buffer nach Aufträgen im Status "A0". Dabei existieren 
folgende Möglichkeiten:

  - (1) : kein Datensatz im Buffer mit Status "A0"
  - (2) : ein Datensatz im Buffer mit Status "A0"
  - (3) : mehr als ein Datensatz im Buffer mit Status "A0"

Im Fall (1) kann Ripley keinen passenden Wert für seinen Buffer Key im richtigen
Status finden und bricht das Senden des Telegramms ab.

Im Fall (2) ermittelt Ripley den Wert des Buffer Keys, hier "${buffer_bicycleNo}",
mit diesem Wert werden dann die notwendigen Daten aus dem Buffer gelesen, das 
Telegramm zusammengestellt und versendet.

Nach dem Versenden wird der Datensatz vom "previousStatus" "A0" auf den aktuellen
"status" "A1" angehoben. Außerdem wird der "status timestamp" auf die
aktuelle Zeit gesetzt. Damit steht beim nächsten Aussenden des Telegramms in
Event "sendStatusAssemlyStart" dieser Datensatz nicht mehr zur Verfügung.

Fall (3) ist fast identisch zu Fall (2). Allerdings sucht Ripley bei mehreren
Datensätzen im Status "A0" den mit dem ÄLTESTEN "status timestamp" aus.  
Für diesen Datensatz erfolgen dann die gleichen Aktionen wie im Fall (2):
  - Telegramm aus Buffer-Daten zusammenstellen
  - Telegramm versenden
  - Status auf "A1" setzen
  - "status timestamp" auf aktuelle Zeit setzen
  
Mit diesem Vorgehen simuliert Ripley das sequenzielle Bauen/ Montieren. Im
FIFO (First-In-First-Out) Verfahren werden Datensätze von Status zu Status
weitergereicht.

Beim Event "sendStatusAssemlyStart" beträgt die cycleTime 60 Sekunden d.h.
Ripley versucht alle 60 Sekunden vom Vorgängerstatus "A0" einen Datensatz
zu ermitteln.

Die Änderung des Buffers lässt sich live per Ripley-GUI nachverfolgen.

Der Nachfolge-Event "sendStatusWheelsAssemlyStart" ist analog zum Event
"sendStatusAssemlyStart" aufgebaut.


Erklärung Event "sendStatusAssemlyEnd"
......................................

Dieser Event ist ebenfall fast identisch zu den beiden Vorgänger-Events. 
Allerdings ist hier noch der Parameter "maxEntriesOfStatusInBuffer"
definiert. Dieser sorgt dafür, dass der Ripley Buffer von alten Einträgen
befreit wird. Konkret definiert der Parameter wieviele der letzten
Einträge im Status "A3" im Buffer verbleiben sollen. 

Im Beispiel ist "maxEntriesOfStatusInBuffer" auf "5" definiert. Dies 
bedeutet, dass nur die neusten fünf Datensätze im Status "A3" im Buffer
verbleiben. Alle älteren werden von Ripley abgelöscht.


====================
8. Externe Variablen
====================

Ripley bietet die Möglichkeit während einer laufenden Emulation externe Programme
aufzurufen und deren Ausgabe wiederum in ausgehenden Telegrammen zu benutzen.
Dadurch lässt sich Ripley an den unterschiedlichsten Stellen einer Emulation
mit externen Daten beeinflussen (z.B. dem Ergebnis einer Datenbank-Abfrage).

Der Aufruf der Programme kann mit beiden Empfangsvariablen-Typen, "Direkte Antwort" 
und Buffer, geschehen. Damit stehen der Emulation beliebige Datenquellen zur Verfügung. 

Um externe Variablen in der Telegramm-Definition zu nutzen, wird folgendes 
Muster verwendet:

${external_ripleyNameDatenquelle_schluessel}"

Der Präfix "external" signalisiert Ripley, dass es sich um eine externe Variable
handelt. Der zweite Teil (hier "ripleyNameDatenquelle") gibt an aus welcher
Datenquelle die Variable stammt. Der dritte Teil (hier "schluessel") ist der 
Name der Variable.

Die nächsten Abschnitte zeigen, wie sich die einzelnen Teile der Variablen-
definintion in der Ripley-Konfiguration wiederfinden.


Definition einer Datenquelle
============================

Datenquellen treten in Ripley an zwei verschiedenen Orten auf:
  - in der globalen Sektion, wo die Datenquellen definiert werden
  - im jeweiligen Sende-Event im "run" Abschnitt, wo die Datenquelle 
    aufgerufen wird
  

Globale Definition der Datenquellen
-----------------------------------

Die Datenquellen werden als Liste definiert. Dabei wird als erstes ein 
Ripley interner Alias-Name für die Datenquelle vergeben. Danach wird durch ein
Komma getrennt, der eigentliche Programm-Pfad angegeben. 
Später, beim Aufrufen der Datenquelle im "run" Abschnitt wird nur der Alias-
Name verwendet.


Beispiel:

    externalDatasource:
        program1: "/opt/programs/myFirstScript.sh"
        program2: "/opt/programs/mySecondScript.sh"

In den späteren "run" Abschnitten werden dann nur noch die Alias-Namen 
"program1" und "program2" verwendet.

Eventuelle Argumente für die externe Datenquelle lassen sich hier innerhalb
der Pfaddefinition angeben. Zu empfehlen ist allerdings die Definition von
Argumenten im "run" Abschnitt. Dort lassen sich sowohl fixe
als auch dynamische Argumente an die Datenquelle übergeben.


Aufbau des externen Programms
-----------------------------

Ripley erwartet beim Programm-Aufruf ein ein- oder mehrzeiliges Ergebnis 
der Form

Schlüssel1:Wert1
Schlüssel2:Wert2

als Antwort zurück.


Beispiel eines externen Programms
.................................

Um ein Gewicht an Ripley zurückzugeben könnte das externe Programm folgende
Zeile zurückgeben:

weight:12kg

Dann würde das Gewicht in der externen Ripley-Variable "weight" abgelegt werden.

Ein simples Beispiel für ein externes Programm, implementiert als Shell-Skript 
könnte so aussehen:

#!/bin/bash

echo "weight:12kg"


Aufruf der Datenquelle
======================

Ein oder mehrere externe Programme können vor der eigentlichen Telegramm-Definition
in einem Send-Event aufgerufen werden. Dafür existiert innerhalb der Aktionen
für ein Telegramm der Abschnitt "run". 

In "run" wird im einfachsten Fall einfach nur der Name der Datenquelle definiert,
damit wird dann das entsprechende Programm ausgeführt.

Beispiel:

    run:
        - [  "program1" ]

ruft das Programm auf, welches in "externalDatasource" für "program1" definiert wurde.
In diesem Beispiel wäre das "/opt/programs/myFirstScript.sh"


Statische Argumente
-------------------

Es ist möglich die externe Datenquelle mit statischen Argumenten aufzurufen. Dies
geschieht in einer per Komma getrennten Liste der Argumente. Die Argumente selbst
müssen in doppelten Anführungszeichen stehen.

Beispiel:
 
    run:
        - [  "program1", "argument 1", "argument 2" ]

Dieser Aufruf von "program1" würde zur Ausführung folgender Kommandozeile führen:

/opt/programs/myFirstScript.sh "argument 1" "argument 2"


Dynamische Argumente
--------------------

Eine Stärke von Ripley ist es auf einfache Weise externe Datenquellen mit Argumenten
aufzurufen die sich aus empfangenen bzw. im Buffer befindlichen Daten bilden.

Grundsätzlich ist es möglich "Direkte Antwort"-Variablen und Buffer-Variablen in 
Argumenten zu nutzen.

Beispiel:
 
    run:
        - [  "program1", "${weight}", "${buffer_status}" ]

In diesem Beispiel würde Ripley versuchen, den Wert von "weight" aus dem gerade
erst empfangenen Telegramm als erstes Argument zu verwenden. Als zweites Argument
würde Ripley versuchen den "status" Wert aus dem Buffer zu lesen.

Der Key um auf den Wert von "status" im Buffer zuzugreifen ist dabei entweder 
der Buffer Key des soeben empfangenen Telegramms oder ermittelt sich aus dem
ältesten Buffer Key des Events im Vorgänger-Status. Details dazu sind im 
Kapitel "Buffer Variablen" zu finden.

Falls Ripley eine Variable nicht auflösen kann wird eine String mit Null Zeichen
Länge als Argument verwendet.


Mehrere Datenquellen aufrufen
-----------------------------

Um mehrere Datenquellen aufzurufen, wird im "run" Abschnitt folgende Syntax 
verwendet:

    run:
        - [  "program1", "${weight}", "${buffer_status}" ]
        - [  "program2", "argument" ]

Jetzt werden "program1" und "program2" mit ihren jeweiligen Argumenten 
ausgeführt.


Zugriff auf die Ergebnisse der Datenquelle
------------------------------------------

Nach dem Aufruf der Datenquellen stehen die Ergebnisse in externen
Ripley-Variablen zur Verfügung. Dabei sind z.B. die Ergebnisse
von Alias "program1" unter

${external_program1_<Schlüsselname aus der Programmausgabe>} zu finden,

für "program2" ist die Benutzung analog, lediglich der Alias-Name
wird gewechselt.

${external_program2_<Schlüsselname aus der Programmausgabe>}.

Angenommen bei Aufruf von "program2" wird unter anderem folgende Zeile
zurückgeliefert: 

size:12

Die externe Variable um auf den Wert von "size" (hier "12") in der Telegramm-
Definition zurückgreifen zu können, lautet:

${external_program2_size}

Der nächste Abschnitt zeigt anhand eines Beispiel wie externe Variablen 
in Telegramm-Definitionen genutzt werden können.


Verwenden von externen Variablen in der Telegramm-Definition
============================================================

Externe Variablen stehen nach ihrem Befüllen nur für ein Sende-Telegramm
innerhalb der gleichen Aktion zur Verfügung.

Folgendes Beispiel zeigt ein komplettes Event, in dessen erster Aktion 
"receiveTeleg" ein Telegramm empfangen und teilweise im Buffer
abgespeichert wird (siehe auch "Buffer Variablen"). 

In der zweiten Aktion "sendReceipt" werden zwei Dinge getan:

  1. Es wird definiert, dass "program1" mit zwei Parametern ausgeführt wird.
     Die Parameter sind Daten des vorher in "receiveTeleg" empfangenen 
     Telegramms.
  2. Es wird ein Telegramm zusammengestellt und versendet. Dabei
     wird der Wert des Schlüssels "weight" aus der Ausgabe vom "program1"


    beispielEvent:
        description: example event
        direction: "receive"  
        actions:
            receiveTeleg:
                telegram:
                    #  Offset|Lng|  Value    |      Comment   
                    # ------------------------------------------------
                    - [  1,     8, "PCS2EMU "                    ]
                    - [  9,     8, "${buffer_testKey}"           ]
                    - [ 17,     8, "RCVTEST "                    ]
                    - [ 25,     4, "${buffer_weight}"            ]
                    - [ 29,     4, "${buffer_size}"              ]
                    - [ 33,     4, ""                            ]
                    - [ 37,     4, "${length}"                   ]            
            sendReceipt:
                run:
                    - [  "program1", "${buffer_testKey}", "${length}" ]
                telegram:
                    #  Offset|Lng|  Value    |      Comment   
                    # -----------------------------------------------------
                    - [  1,     8, "EMU2PCS "                     ]
                    - [  9,     8, "${external_program1_weight}" ]


Unabhängig von der Reihenfolge der Abschnitte "run" und "telegram" einer Aktion,
wird immer der "run" Abschnitt als erster ausgeführt. Damit stehen dann auch
die extern ermittelten Daten im Abschnitt "telegram" zur Verfügung.

  
================
9. Weboberfläche
================

Die grafische Benutzeroberfläche von Ripley wurde als Web-GUI implementiert. 


Zugriff
=======

Die GUI ist unter dem Rechnernamen erreichbar auf dem Ripley aktuell ausgeführt 
wird. 

Der Standard-Port für die Web-GUI ist "4275". Dieser kann über den globalen
Parameter "httpPort" geändert werden.

Beim Start von Ripley über die Kommandozeile gibt das Programm darüber Auskunft
wie die Web-Oberfläche zu erreichen ist.

Beispiel:
2012-04-03 22:14:37 (1): Web GUI is listening at http://test-pc:10119/


Bereiche
========

Es existieren vier Anzeigebereiche:
  - Overview
  - Buffer Content
  - Log
  - Config


Overview
--------

"Overview" generiert aus der Konfigurationsdatei eine Darstellung bei der 
jedes Event als ein Rechteck dargestellt wird. Es wird der Name des Events
sowie (wenn definiert) die Beschreibung des Events angezeigt (parameter "description").
Die Reihenfolge der Darstellung entspricht der Reihenfolge der Events
in der Ripley-Konfigurationsdatei.

Falls dem Event ein Status konfiguriert wurde, wird auch dieser angezeigt.
Sobald im Buffer von Ripley Daten für einen bestimmten Status existieren, werden
diese im entsprechenden Event-Rechteck als sortierbare Tabelle dargestellt.

Die Aktualisierung der Übersicht erfolgt in Echtzeit.

Für Events mit "direction: send" besteht zusätzlich die Möglichkeit direkt aus der 
"Overview-Übersicht" das Event auszulösen. Dies geschieht über Klicken des
">>" - Button hinter dem Namen des Events. 

Der Emulator alleine löst ein Event normalerweise nur auf zwei Arten aus:
  - beim Starten des Emulators
  - nach Ablauf der "cycleTime"
  
Mittels des ">>" - Buttons besteht zusätzlich die Möglichkeit schon vor Ablauf 
der "cycleTime" ein Telegramm für einen bestimmten Status auszusenden, entsprechende 
Daten im Buffer vorausgesetzt. Diese Funktion ermöglicht z.B. das zügige manuelle
Durchtakten von Auftragsdaten durch die Emulation.


Buffer Content
--------------

In diesem Menü-Punkt wird der komplette Inhalt des Buffers als sortierbare Tabelle
dargestellt. Die Aktualisierung der Tabelle erfolgt in Echtzeit.


Log
---

Der Menü-Punkt "Log" zeigt die letzten 300 Ausgabezeilen der Ripley-Konsole an.


Config
------

"Config" zeigt die aktuell laufende Ripley-Konfiguration an.


===========
10. Glossar
===========

Buffer     Buffer Variablen schneiden einen Wert aus einem empfangenen Telegramm 
Variable   aus und legen diesen Wert in einen speziellen Speicherbereich des 
           Emulators, dem Buffer, ab. Sende- und Empfangstelegramme der gesamten 
           Emulation können dann auf die im Buffer abgelegten Werte zugreifen.

"Direkte   Schneidet aus einem Empfangstelegramm ein Stück aus und stellt diesen
Antwort"   dem direkt darauf folgendem Sendetelegrammdes Events wieder zur Verfügung. 
Variable   Es werden keine Daten im Buffer abgelegt. 

Externe    Variable, die in Ripley durch eine externe Datenquelle geladen wird.
Variable

PCS        Production Control System - Gegenspieler von Ripley.

PLC        Programmable Logic Controller

Ripley     Der Name des Emulators ist von Patricia Highsmiths Haupthelden im Buch 
           "Der talentierte Mr. Ripley" geborgt.

Ripley     Variablen für Sendetelegramme. Wird intern von Ripley generiert.
interne    Momentan sind ${ripley_date} und ${ripley_time} implementiert.
Variable         

YAML       "YAML Ain't Markup Language". Ein hochkompaktes Datenformat welches 
           die gleichen Aufgaben erfüllt wie XML - bloss schlanker. Zur Erstellung der
           Dokumentenstruktur werden anstelle von XML-Tags gezielt Einrückungen
           mit Leerzeichen genutzt.
           Ripley nutzt YAML als Format für seine Konfigurationsdateien.

==================
11. Tipps & Tricks
==================

  - Ripley nutzt die Socket.IO Beibliothek zur Kommunikation zwischen Web-Browser
    und Emulator. Diese Bibliothek benötigt node.js MIT SSL-Unterstützung (Standard-Compliation).
    
