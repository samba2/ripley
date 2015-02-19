#!/bin/bash

COMPILER="/home/xubuntu/dev/emu_svn/ripley/trunk/node_modules/uglify-js/bin/uglifyjs"
SRC="/home/xubuntu/dev/emu_svn/ripley/trunk"
DST="/home/xubuntu/dev/emu_svn/ripley/trunk/build"

GUI_DST="$DST/gui"
GUIJS_DST_UNCOMPRESSED="$DST/gui/js/ripleyGui_uncompressed.js"
GUIJS_DST="$DST/gui/js/ripleyGui.js"

EXAMPLE_SRC="$SRC/test/functionTest/ripleyTestCases"
EXAMPLE_DST="$DST/examples"

RIPLEY_DST_UNCOMPRESSED="$DST/ripley_uncompressed.js"
RIPLEY_DST="$DST/ripley.js"


function clean {
    echo "Emptying '$DST/'"
    rm -rf $DST/*
    rmdir $DST
}

function copyFiles {
    echo "Creating $DST"
    mkdir "$DST"
    
    echo "Copying bin"
    cp -r  "$SRC/bin" $DST
    
    echo "Copying node_modules"
    cp -r  "$SRC/node_modules" $DST

    echo "Copying gui"
    mkdir "$GUI_DST"
    cp -r  "$SRC/gui/css" "$GUI_DST"
    cp -r  "$SRC/gui/lib" "$GUI_DST"
    cp -r  "$SRC/gui/media" "$GUI_DST"

    echo "Copying ripley executables"
    cp "$SRC/ripley.sh" $DST        
    cp "$SRC/ripley.bat" $DST        

    echo "Copying examples"
    mkdir "$EXAMPLE_DST"
    cp "$EXAMPLE_SRC/test1.yml" "$EXAMPLE_DST/simple_send_event.yml"
    cp "$EXAMPLE_SRC/test3a_buffer_receive_and_send.yml" "$EXAMPLE_DST/simple_buffer_event.yml"
    cp "$EXAMPLE_SRC/test3b_use_received_vars_in_answer.yml" "$EXAMPLE_DST/mixed_buffer_and_direct_answer_vars.yml"
    cp "$EXAMPLE_SRC/test3c_ripley_internal_vars.yml" "$EXAMPLE_DST/ripley_internal_vars.yml"
    cp "$EXAMPLE_SRC/test9_passive.yml" "$EXAMPLE_DST/more_complex_emulation.yml"    
    cp "$EXAMPLE_SRC/test12b_buffer_and_directAnswer_var_as_script_argument.yml" "$EXAMPLE_DST/external_variables.yml"    

    echo "Copying example programs"
    mkdir "$EXAMPLE_DST/externalPrograms"
    cp "$SRC/externalPrograms/getExternalBufferKey.sh" "$EXAMPLE_DST/externalPrograms"
    cp "$SRC/externalPrograms/valueEcho.sh" "$EXAMPLE_DST/externalPrograms"

    echo "Copying documents"
    cp "$SRC/TODO.txt" "$DST/"
    # convert encoding for correct displaying of umlaute + unix2 conversion
    cat "$SRC/README.txt" | iconv --from-code UTF-8 --to-code ISO_8859-14:1998 | sed 's/$/\r\n/' > "$DST/README.txt"
    
    echo "Adjusting permissions"
    find "$DST/" -type f -exec chmod 644 '{}' \;
    find "$DST/" -type d -exec chmod 755 '{}' \;
    chmod 775 "$DST/ripley.sh"
    chmod 775 "$DST/bin/node-linux"
}


function compressRipleyGuiJsFiles {

    mkdir "$GUI_DST/js"    
    for fileName in $SRC/gui/js/*; do
        echo "Merging $fileName to $GUIJS_DST_UNCOMPRESSED"
        cat "$fileName" >> "$GUIJS_DST_UNCOMPRESSED"
    done

    echo "Compressing $GUIJS_DST_UNCOMPRESSED"
    $COMPILER --mangle-toplevel "$GUIJS_DST_UNCOMPRESSED" > "$GUIJS_DST"

    # remove single javascript lines (class remove) + enable ripleyGui.js by removing surrounding comments
    cat "$SRC/gui/index.html" | egrep -v 'class="remove"|central JS file' >> "$GUI_DST/index.html"
}


function compressRipleyCoreJsFiles {
    for fileName in $SRC/class/*; do
        echo "Merging $fileName to $RIPLEY_DST_UNCOMPRESSED"
        cat "$fileName" | egrep -v "require\('\./[[:alnum:]]+\.js'\)|module.exports" >> $RIPLEY_DST_UNCOMPRESSED
    done

    cat "$SRC/ripley.js" | grep -v './class/' >> $RIPLEY_DST_UNCOMPRESSED
                
    echo "Compressing $RIPLEY_DST_UNCOMPRESSED"
    $COMPILER --mangle-toplevel "$RIPLEY_DST_UNCOMPRESSED" > "$RIPLEY_DST"
}


function postCleanUp {
    echo "Removing uncompressed $RIPLEY_DST_UNCOMPRESSED"
    rm $RIPLEY_DST_UNCOMPRESSED
    rm $GUIJS_DST_UNCOMPRESSED
    
    echo "Deleting .svn files"
    find $DST/ -name ".svn" -type d -exec rm -rf '{}' \; 2>/dev/null
}


if [ "$1" = "clean" ]; then
    clean
    exit
fi    

clean
copyFiles
compressRipleyCoreJsFiles
compressRipleyGuiJsFiles
postCleanUp
echo ""
echo "Releasable version of Ripley is now in $DST"
echo ""
