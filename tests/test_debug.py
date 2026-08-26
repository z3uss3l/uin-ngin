from uin.debug import environment_report


def test_environment_report_has_required_diagnostics():
    report = environment_report()
    assert report["uin_version"]
    assert report["python"]
    assert report["platform"]
    assert report["executable"]
