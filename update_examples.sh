#!/bin/bash

folders=(
  "with-astro"
  "with-next-app-router"
  "with-react-router-v7"
  "with-vite-preact"
  "with-vite-react"
  "with-vite-solid"
  "with-vite-svelte"
  "with-vite-vue"
)

echo "Entering examples directory..."
cd examples || { echo "Error: examples directory not found"; exit 1; }

for folder in "${folders[@]}"; do
  if [ -d "$folder" ]; then
    echo "Processing $folder..."
    (cd "$folder" && npm i @plumeria/core@latest @plumeria/compiler@latest)
    echo "Finished $folder"
    echo "----------------------------------------"
  else
    echo "Warning: Directory $folder not found, skipping..."
    echo "----------------------------------------"
  fi
done

echo "All installations completed."