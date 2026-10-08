import logging


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    logging.getLogger(__name__).info(
        "Worker scaffold only: benchmark extraction/validation, job claiming, "
        "agent execution and trusted grading are not implemented."
    )


if __name__ == "__main__":
    main()
