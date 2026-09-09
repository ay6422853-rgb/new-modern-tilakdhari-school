import React, { useEffect, useState } from "react";
import { create, list, update } from "../../api";
import "./FeeStructures.css";

const blankItem = {
  name: "",
  amount: "",
  frequency: "MONTHLY",
};

const blank = {
  classId: "",
  className: "",
  session: "",
  items: [
    {
      name: "Tuition Fee",
      amount: "",
      frequency: "MONTHLY",
    },
  ],
};

const frequencyLabels = {
  ONE_TIME: "One Time",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  HALF_YEARLY: "Half Yearly",
  YEARLY: "Yearly",
};

export default function FeeStructures() {
  const [form, setForm] = useState(blank);

  const [classes, setClasses] = useState([]);
  const [data, setData] = useState([]);

  const [editing, setEditing] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD CLASSES
  // =====================================================

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      setError("");

      const result = await list("accountant/classes");

      console.log(
        "========================================"
      );
      console.log(
        "ACCOUNTANT CLASSES RESPONSE:",
        result
      );
      console.log(
        "========================================"
      );

      let classList = [];

      if (Array.isArray(result)) {
        classList = result;
      } else if (
        Array.isArray(result?.classes)
      ) {
        classList = result.classes;
      } else if (
        Array.isArray(result?.data)
      ) {
        classList = result.data;
      } else if (
        Array.isArray(result?.results)
      ) {
        classList = result.results;
      } else if (
        Array.isArray(result?.items)
      ) {
        classList = result.items;
      }

      console.log(
        "FINAL CLASS LIST:",
        classList
      );

      setClasses(classList);
    } catch (err) {
      console.error(
        "ACCOUNTANT CLASSES ERROR:",
        err
      );

      setClasses([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Classes load nahi ho paayi."
      );
    } finally {
      setLoadingClasses(false);
    }
  };

  // =====================================================
  // LOAD FEE STRUCTURES
  // =====================================================

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await list(
        "accountant/fee-structures"
      );

      console.log(
        "FEE STRUCTURES RESPONSE:",
        result
      );

      let feeList = [];

      if (Array.isArray(result)) {
        feeList = result;
      } else if (
        Array.isArray(result?.feeStructures)
      ) {
        feeList = result.feeStructures;
      } else if (
        Array.isArray(result?.feeStructure)
      ) {
        feeList = result.feeStructure;
      } else if (
        Array.isArray(result?.data)
      ) {
        feeList = result.data;
      } else if (
        Array.isArray(result?.results)
      ) {
        feeList = result.results;
      } else if (
        Array.isArray(result?.items)
      ) {
        feeList = result.items;
      }

      console.log(
        "FINAL FEE STRUCTURE LIST:",
        feeList
      );

      setData(feeList);
    } catch (err) {
      console.error(
        "Fee structure error:",
        err
      );

      setData([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Fee structures load nahi hui."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadClasses();
    load();
  }, []);

  // =====================================================
  // CLASS CHANGE
  // =====================================================

  const handleClassChange = (e) => {
    const classId = e.target.value;

    const selectedClass = classes.find(
      (item) =>
        String(item._id || item.id) ===
        String(classId)
    );

    console.log(
      "SELECTED CLASS:",
      selectedClass
    );

    setForm((prev) => ({
      ...prev,

      classId,

      className:
        selectedClass?.name ||
        selectedClass?.className ||
        selectedClass?.title ||
        "",
    }));
  };

  // =====================================================
  // FORM FIELD
  // =====================================================

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // =====================================================
  // ITEM UPDATE
  // =====================================================

  const updateItem = (
    index,
    key,
    value
  ) => {
    setForm((prev) => {
      const items = [...prev.items];

      items[index] = {
        ...items[index],
        [key]: value,
      };

      return {
        ...prev,
        items,
      };
    });
  };

  // =====================================================
  // ADD ITEM
  // =====================================================

  const addItem = () => {
    setForm((prev) => ({
      ...prev,

      items: [
        ...prev.items,
        {
          ...blankItem,
        },
      ],
    }));
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const removeItem = (index) => {
    setForm((prev) => {
      if (prev.items.length === 1) {
        return prev;
      }

      return {
        ...prev,

        items: prev.items.filter(
          (_, i) => i !== index
        ),
      };
    });
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validate = () => {
    if (!form.classId) {
      return "Please select class.";
    }

    if (!form.session.trim()) {
      return "Please enter session.";
    }

    if (!form.items.length) {
      return "At least one fee item is required.";
    }

    for (
      let i = 0;
      i < form.items.length;
      i++
    ) {
      const item = form.items[i];

      if (!item.name.trim()) {
        return `Fee item ${
          i + 1
        }: name is required.`;
      }

      if (
        item.amount === "" ||
        Number(item.amount) < 0
      ) {
        return `Fee item ${
          i + 1
        }: valid amount enter karein.`;
      }

      if (!item.frequency) {
        return `Fee item ${
          i + 1
        }: frequency select karein.`;
      }
    }

    return "";
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const body = {
        classId: form.classId,

        className:
          form.className.trim(),

        session:
          form.session.trim(),

        items: form.items.map(
          (item) => ({
            name:
              item.name.trim(),

            amount:
              Number(item.amount),

            frequency:
              item.frequency,
          })
        ),
      };

      console.log(
        "FEE STRUCTURE PAYLOAD:",
        body
      );

      if (editing) {
        await update(
          "accountant/fee-structures",
          editing,
          body
        );

        setSuccess(
          "Fee structure successfully updated."
        );
      } else {
        await create(
          "accountant/fee-structures",
          body
        );

        setSuccess(
          "Fee structure successfully created."
        );
      }

      resetForm(false);

      await load();
    } catch (err) {
      console.error(
        "Save fee structure:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Fee structure save nahi hui."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const edit = (fee) => {
    setError("");
    setSuccess("");

    setEditing(fee._id);

    setForm({
      classId:
        fee.classId?._id ||
        fee.classId ||
        "",

      className:
        fee.className ||
        fee.classId?.name ||
        fee.classId?.className ||
        "",

      session:
        fee.session || "",

      items:
        Array.isArray(fee.items) &&
        fee.items.length
          ? fee.items.map(
              (item) => ({
                name:
                  item.name || "",

                amount:
                  item.amount !==
                  undefined
                    ? item.amount
                    : "",

                frequency:
                  item.frequency ||
                  "MONTHLY",
              })
            )
          : [
              {
                ...blankItem,
              },
            ],
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // RESET
  // =====================================================

  const resetForm = (
    clearMessages = true
  ) => {
    setForm({
      classId: "",

      className: "",

      session: "",

      items: [
        {
          name: "Tuition Fee",
          amount: "",
          frequency: "MONTHLY",
        },
      ],
    });

    setEditing(null);

    if (clearMessages) {
      setError("");
      setSuccess("");
    }
  };

  // =====================================================
  // TOTAL
  // =====================================================

  const totalFee =
    form.items.reduce(
      (total, item) =>
        total +
        (Number(item.amount) || 0),
      0
    );

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fee-structure-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="fee-head">
        <div>
          <span>
            ACCOUNTANT PANEL
          </span>

          <h1>
            Fee Structure
          </h1>

          <p>
            Create and manage
            class-wise fee
            structures for the
            school.
          </p>
        </div>
      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {error && (
        <div className="fee-alert fee-error">
          <strong>
            Error:
          </strong>{" "}
          {error}
        </div>
      )}

      {success && (
        <div className="fee-alert fee-success">
          {success}
        </div>
      )}

      {/* =================================================
          FORM
      ================================================= */}

      <form
        className="fee-form"
        onSubmit={submit}
      >

        {/* FORM TITLE */}

        <div className="fee-form-title">
          <div>
            <h2>
              {editing
                ? "Edit Fee Structure"
                : "Create Fee Structure"}
            </h2>

            <p>
              Define fees for a
              particular class and
              academic session.
            </p>
          </div>

          {editing && (
            <button
              type="button"
              className="fee-cancel-btn"
              onClick={() =>
                resetForm()
              }
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* =================================================
            BASIC DETAILS
        ================================================= */}

        <div className="fee-basic-grid">

          {/* CLASS */}

          <label className="fee-field">
            <span>
              Class <b>*</b>
            </span>

            <select
              value={form.classId}
              onChange={
                handleClassChange
              }
              required
              disabled={
                loadingClasses
              }
            >
              <option value="">
                {loadingClasses
                  ? "Loading classes..."
                  : classes.length === 0
                  ? "No classes available"
                  : "Select Class"}
              </option>

              {classes.map(
                (item) => {
                  const id =
                    item._id ||
                    item.id;

                  const name =
                    item.name ||
                    item.className ||
                    item.title ||
                    "";

                  return (
                    <option
                      key={id}
                      value={id}
                    >
                      {name}
                    </option>
                  );
                }
              )}
            </select>

            {!loadingClasses &&
              classes.length === 0 && (
                <small
                  style={{
                    color: "#dc2626",
                    marginTop: "6px",
                    display:
                      "block",
                  }}
                >
                  No classes found.
                  Check accountant
                  classes API.
                </small>
              )}
          </label>

          {/* SESSION */}

          <label className="fee-field">
            <span>
              Academic Session{" "}
              <b>*</b>
            </span>

            <input
              type="text"
              value={
                form.session
              }
              onChange={(e) =>
                updateForm(
                  "session",
                  e.target.value
                )
              }
              placeholder="2026-27"
              required
            />
          </label>
        </div>

        {/* =================================================
            FEE ITEMS HEADER
        ================================================= */}

        <div className="fee-items-title">

          <div>
            <h3>
              Fee Items
            </h3>

            <p>
              Add tuition,
              transport, exam,
              annual and other
              applicable fees.
            </p>
          </div>

          <button
            type="button"
            className="add-fee-btn"
            onClick={addItem}
          >
            + Add Fee
          </button>
        </div>

        {/* =================================================
            FEE ITEMS
        ================================================= */}

        <div className="fee-items">

          {form.items.map(
            (item, index) => (
              <div
                className="fee-item"
                key={index}
              >

                {/* NUMBER */}

                <div className="fee-item-number">
                  {index + 1}
                </div>

                {/* NAME */}

                <label>
                  <span>
                    Fee Name
                  </span>

                  <input
                    type="text"
                    placeholder="e.g. Tuition Fee"
                    value={
                      item.name
                    }
                    onChange={(e) =>
                      updateItem(
                        index,
                        "name",
                        e.target.value
                      )
                    }
                    required
                  />
                </label>

                {/* AMOUNT */}

                <label>
                  <span>
                    Amount
                  </span>

                  <div className="amount-input">
                    <span>
                      ₹
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={
                        item.amount
                      }
                      onChange={(e) =>
                        updateItem(
                          index,
                          "amount",
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </label>

                {/* FREQUENCY */}

                <label>
                  <span>
                    Frequency
                  </span>

                  <select
                    value={
                      item.frequency
                    }
                    onChange={(e) =>
                      updateItem(
                        index,
                        "frequency",
                        e.target.value
                      )
                    }
                  >
                    <option value="ONE_TIME">
                      One Time
                    </option>

                    <option value="MONTHLY">
                      Monthly
                    </option>

                    <option value="QUARTERLY">
                      Quarterly
                    </option>

                    <option value="HALF_YEARLY">
                      Half Yearly
                    </option>

                    <option value="YEARLY">
                      Yearly
                    </option>
                  </select>
                </label>

                {/* REMOVE */}

                <button
                  type="button"
                  className="remove-item"
                  onClick={() =>
                    removeItem(index)
                  }
                  disabled={
                    form.items.length ===
                    1
                  }
                  title="Remove fee"
                >
                  ×
                </button>
              </div>
            )
          )}
        </div>

        {/* =================================================
            TOTAL
        ================================================= */}

        <div className="fee-summary">

          <div>
            <span>
              Total Structure Value
            </span>

            <strong>
              ₹
              {totalFee.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

          <small>
            Monthly/quarterly/yearly
            applicability will be
            handled according to
            the selected frequency.
          </small>
        </div>

        {/* =================================================
            SAVE
        ================================================= */}

        <div className="fee-form-actions">

          <button
            type="button"
            className="fee-reset-btn"
            onClick={() =>
              resetForm()
            }
          >
            Reset
          </button>

          <button
            type="submit"
            className="fee-save-btn"
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : editing
              ? "Update Structure"
              : "Save Structure"}
          </button>
        </div>
      </form>

      {/* =================================================
          EXISTING STRUCTURES
      ================================================= */}

      <div className="fee-list">

        <div className="fee-list-head">

          <div>
            <h2>
              Existing Fee Structures
            </h2>

            <p>
              Previously created
              class-wise fee
              structures.
            </p>
          </div>

          <span className="fee-count">
            {data.length} Structure
            {data.length !== 1
              ? "s"
              : ""}
          </span>
        </div>

        {/* LOADING */}

        {loading &&
        data.length === 0 ? (
          <div className="fee-empty">
            Loading fee
            structures...
          </div>
        ) : data.length === 0 ? (
          <div className="fee-empty">
            <h3>
              No fee structures
              found
            </h3>

            <p>
              Create your first
              fee structure using
              the form above.
            </p>
          </div>
        ) : (
          <div className="fee-records">

            {data.map((fee) => {
              const recordTotal =
                fee.items?.reduce(
                  (sum, item) =>
                    sum +
                    (Number(
                      item.amount
                    ) || 0),
                  0
                ) || 0;

              return (
                <div
                  className="fee-record"
                  key={fee._id}
                >

                  {/* LEFT */}

                  <div className="fee-record-main">

                    <div className="fee-record-top">

                      <div>
                        <h3>
                          {fee.className ||
                            fee.classId
                              ?.name ||
                            "Class"}
                        </h3>

                        <p>
                          Academic
                          Session:{" "}
                          <strong>
                            {fee.session ||
                              "-"}
                          </strong>
                        </p>
                      </div>

                      <div className="fee-record-total">
                        <span>
                          Total
                        </span>

                        <strong>
                          ₹
                          {recordTotal.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* ITEMS */}

                    <div className="fee-record-items">

                      {fee.items?.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            className="fee-record-item"
                            key={
                              index
                            }
                          >

                            <div>
                              <strong>
                                {
                                  item.name
                                }
                              </strong>

                              <span>
                                {frequencyLabels[
                                  item
                                    .frequency
                                ] ||
                                  item.frequency}
                              </span>
                            </div>

                            <strong>
                              ₹
                              {Number(
                                item.amount ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </strong>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* ACTION */}

                  <div className="fee-record-action">

                    <button
                      type="button"
                      onClick={() =>
                        edit(fee)
                      }
                    >
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}