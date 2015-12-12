if [ -z "$IDENTIFIER" ]; then
    echo "IDENTIFIER needs to be set to the certificate organization"
    exit 1
fi  

cd Brave-darwin-x64/Brave.app/Contents/Frameworks
codesign --deep --force --strict --verbose --sign $IDENTIFIER *

cd ../../..
codesign --deep --force --strict --verbose --sign $IDENTIFIER Brave.app/
