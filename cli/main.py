import argparse
from pathlib import Path
from core.utils.edge_extraction import create_uin_package, batch_process_directory
from core.validation.schema_validator import SchemaValidator

def main():
    parser = argparse.ArgumentParser(prog="uin", description="UIN-NGIN CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Extract (einzelnes Bild)
    extract = subparsers.add_parser("extract", help="Edge-Extraction + UIN-Paket für ein Bild")
    extract.add_argument("image", type=Path, help="Eingabebild")
    extract.add_argument("-o", "--output", type=Path, default=Path("./uin_output"), help="Ausgabeverzeichnis (default: ./uin_output)")
    extract.add_argument("-l", "--low", type=int, default=100, help="Unterer Canny-Threshold (default: 100)")
    extract.add_argument("-H", "--high", type=int, default=200, help="Oberer Canny-Threshold (default: 200)")

    # Batch (Verzeichnis)
    batch = subparsers.add_parser("batch", help="Batch-Verarbeitung eines Verzeichnisses")
    batch.add_argument("input_dir", type=Path, help="Eingabeverzeichnis mit Bildern")
    batch.add_argument("-o", "--output", type=Path, default=Path("./uin_output"), help="Basis-Ausgabeverzeichnis (default: ./uin_output)")
    batch.add_argument("-l", "--low", type=int, default=100, help="Unterer Canny-Threshold (default: 100)")
    batch.add_argument("-H", "--high", type=int, default=200, help="Oberer Canny-Threshold (default: 200)")

    # Validate
    validate = subparsers.add_parser("validate", help="Schema-Validierung")
    validate.add_argument("doc", type=Path, help="UIN-Dokument (JSON)")
    validate.add_argument("schema", type=Path, help="Schema-Datei (JSON)")

    args = parser.parse_args()

    if args.command == "extract":
        print(f"Einzelbild-Verarbeitung: {args.image}")
        result = create_uin_package(args.image, args.output, args.low, args.high)
        print(f"\nUIN-Paket erstellt:")
        print(f"   Kantenbild: {result['edge_image']}")
        print(f"   UIN-JSON: {result['uin_json']}")
        print(f"   Vorschau: {result['preview']}")
        print(f"   Kantendichte: {result['stats']['edge_percentage']:.2f}%")
    elif args.command == "batch":
        print(f"Batch-Verarbeitung: {args.input_dir} -> {args.output}")
        batch_process_directory(args.input_dir, args.output, args.low, args.high)
    elif args.command == "validate":
        validator = SchemaValidator(args.schema)
        success = validator.validate(args.doc)
        exit(0 if success else 1)

if __name__ == "__main__":
    main()
