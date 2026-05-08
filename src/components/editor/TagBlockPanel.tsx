"use client";

import {
  type ActivityBundle,
  type CaregiverRole,
  type EntityBinding,
  type EntityRole,
  type IbKeyConcept,
  type Mechanic,
  type ObservationAngle,
  type TagBlockPillar,
  type TemplateType,
  type TopicAxis,
} from "@/lib/activity-bundle-schema";
import { EditableField } from "@/components/editor/EditableField";

interface TagBlockPanelProps {
  bundle: ActivityBundle;
  onChange: (path: string, value: unknown) => void;
}

const OBSERVATION_ANGLES: ObservationAngle[] = [
  "color",
  "shape",
  "size",
  "quantity",
  "texture",
  "material",
  "pattern",
  "function",
  "origin",
  "behavior",
  "emotion",
  "state",
];

const MECHANICS: Mechanic[] = [
  "enumerate",
  "compare",
  "collect",
  "sort",
  "deduce",
  "voice",
  "build",
  "predict",
  "narrate",
  "care",
];

const ENTITY_ROLES: EntityRole[] = [
  "subject",
  "exemplar",
  "catalyst",
  "reference",
];

const IB_KEY_CONCEPTS: IbKeyConcept[] = [
  "Form",
  "Function",
  "Causation",
  "Change",
  "Connection",
  "Perspective",
  "Responsibility",
];

const TOPIC_AXES: TopicAxis[] = [
  "form",
  "function",
  "causation",
  "change",
  "connection",
  "perspective",
  "responsibility",
];

const PILLARS: TagBlockPillar[] = [
  "Discovery",
  "Performance",
  "Mystery",
  "Creation",
  "Adventure",
  "Connection",
];

const ENTITY_BINDINGS: EntityBinding[] = [
  "bound",
  "parameterized",
  "agnostic",
];

const TEMPLATE_TYPES: TemplateType[] = ["cat1", "cat5"];

const CAREGIVER_ROLES: CaregiverRole[] = [
  "scaffold",
  "co-explorer",
  "observer",
];

interface EnumSelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  helper?: string;
}

function EnumSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  helper,
}: EnumSelectProps<T>) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <label className="text-gray-400 text-xs uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="mt-2 w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-gray-200 text-sm"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {helper && (
        <p className="mt-1 text-[11px] text-gray-500">{helper}</p>
      )}
    </div>
  );
}

interface MultiSelectProps<T extends string> {
  label: string;
  value: T[];
  options: readonly T[];
  onChange: (value: T[]) => void;
  helper?: string;
}

function MultiSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  helper,
}: MultiSelectProps<T>) {
  const toggle = (option: T) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <label className="text-gray-400 text-xs uppercase tracking-wider">
        {label}
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                active
                  ? "bg-indigo-900/60 border-indigo-500 text-indigo-100"
                  : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {helper && (
        <p className="mt-2 text-[11px] text-gray-500">{helper}</p>
      )}
    </div>
  );
}

export function TagBlockPanel({ bundle, onChange }: TagBlockPanelProps) {
  const tb = bundle.tagBlock;
  const sig = tb.activity_signature;

  const handleField = (path: string, value: unknown) => onChange(path, value);
  const handleStringField = (path: string, value: string) =>
    onChange(path, value);

  return (
    <div className="space-y-6">
      <section>
        <h4 className="text-indigo-300 text-sm font-semibold mb-3">
          §0 · Identity
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <EditableField
            label="Activity ID"
            value={tb.activity_id}
            fieldPath="tagBlock.activity_id"
            onChange={handleStringField}
          />
          <EditableField
            label="Source Entity Exemplar"
            value={tb.source_entity_exemplar ?? ""}
            fieldPath="tagBlock.source_entity_exemplar"
            onChange={handleStringField}
          />
          <EnumSelect
            label="Pillar"
            value={tb.pillar}
            options={PILLARS}
            onChange={(v) => handleField("tagBlock.pillar", v)}
            helper="Mirrors spec.identity.pillar via the cross-doc bind."
          />
          <EnumSelect
            label="Template Type"
            value={tb.template_type}
            options={TEMPLATE_TYPES}
            onChange={(v) => handleField("tagBlock.template_type", v)}
          />
          <EditableField
            label="Game Style"
            value={tb.game_style}
            fieldPath="tagBlock.game_style"
            onChange={handleStringField}
          />
        </div>
      </section>

      <section>
        <h4 className="text-indigo-300 text-sm font-semibold mb-3">
          §1 · IB Frame
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <EditableField
            label="Entity"
            value={tb.entity}
            fieldPath="tagBlock.entity"
            onChange={handleStringField}
          />
          <EnumSelect
            label="Entity Binding"
            value={tb.entity_binding}
            options={ENTITY_BINDINGS}
            onChange={(v) => handleField("tagBlock.entity_binding", v)}
          />
          <EnumSelect
            label="Tier — Primary"
            value={tb.tier_range.primary}
            options={["T0", "T1", "T2"] as const}
            onChange={(v) => handleField("tagBlock.tier_range.primary", v)}
          />
          <EditableField
            label="Tier Elasticity"
            value={tb.tier_range.elasticity}
            fieldPath="tagBlock.tier_range.elasticity"
            onChange={handleStringField}
          />
          <MultiSelect
            label="Key Concepts"
            value={tb.key_concepts}
            options={IB_KEY_CONCEPTS}
            onChange={(v) => handleField("tagBlock.key_concepts", v)}
            helper="Closed IB vocabulary (TitleCase). Mirrors prod.basicInfo.coreIbKeyConcepts."
          />
          <MultiSelect
            label="Caregiver Role"
            value={tb.caregiver_role}
            options={CAREGIVER_ROLES}
            onChange={(v) => handleField("tagBlock.caregiver_role", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <EnumSelect
            label="Topic Axis"
            value={tb.progression.topic_axis}
            options={TOPIC_AXES}
            onChange={(v) => handleField("tagBlock.progression.topic_axis", v)}
            helper="Conceptual lens; lowercase. Mirrors dashboard.session.axis."
          />
          <EnumSelect
            label="Difficulty"
            value={String(tb.progression.difficulty_level) as "1" | "2" | "3"}
            options={["1", "2", "3"] as const}
            onChange={(v) =>
              handleField("tagBlock.progression.difficulty_level", Number(v))
            }
          />
          <EditableField
            label="Next Step Hint"
            value={tb.progression.next_step_hint ?? ""}
            fieldPath="tagBlock.progression.next_step_hint"
            onChange={handleStringField}
          />
          <EditableField
            label="Reward Hook"
            value={tb.progression.reward_hook ?? ""}
            fieldPath="tagBlock.progression.reward_hook"
            onChange={handleStringField}
          />
        </div>
      </section>

      <section>
        <h4 className="text-indigo-300 text-sm font-semibold mb-3">
          §2 · Activity Signature
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <EnumSelect
            label="Observation Angle"
            value={sig.observation_angle}
            options={OBSERVATION_ANGLES}
            onChange={(v) =>
              handleField("tagBlock.activity_signature.observation_angle", v)
            }
            helper="Mirrors recap.payloadDefaults.whatWeNoticed and dashboard.session.angle."
          />
          <EnumSelect
            label="Mechanic"
            value={sig.mechanic}
            options={MECHANICS}
            onChange={(v) =>
              handleField("tagBlock.activity_signature.mechanic", v)
            }
          />
          <EnumSelect
            label="Entity Role"
            value={sig.entity_role}
            options={ENTITY_ROLES}
            onChange={(v) =>
              handleField("tagBlock.activity_signature.entity_role", v)
            }
          />
          <EditableField
            label="Focal Attribute"
            value={sig.focal_attribute}
            fieldPath="tagBlock.activity_signature.focal_attribute"
            onChange={handleStringField}
          />
          <EditableField
            label="Intro"
            value={sig.intro}
            fieldPath="tagBlock.activity_signature.intro"
            onChange={handleStringField}
            multiline
          />
          <EditableField
            label="Preview Label"
            value={sig.preview_label}
            fieldPath="tagBlock.activity_signature.preview_label"
            onChange={handleStringField}
          />
          <EditableField
            label="Preview Prompt"
            value={sig.preview_prompt}
            fieldPath="tagBlock.activity_signature.preview_prompt"
            onChange={handleStringField}
            multiline
          />
          <EditableField
            label="Role Pivot Note"
            value={sig.role_pivot_note}
            fieldPath="tagBlock.activity_signature.role_pivot_note"
            onChange={handleStringField}
          />
        </div>
        <div className="mt-4">
          <MultiSelect
            label="Bridge Prerequisites — Primary"
            value={sig.bridge_prerequisites.primary}
            options={OBSERVATION_ANGLES}
            onChange={(v) =>
              handleField(
                "tagBlock.activity_signature.bridge_prerequisites.primary",
                v,
              )
            }
            helper="Up to 3 strongest transition angles from the observation-angle vocabulary."
          />
        </div>
      </section>

      <section>
        <h4 className="text-indigo-300 text-sm font-semibold mb-3">
          §3 · Matchability
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="text-gray-400 text-xs uppercase tracking-wider">
              Tier Support
            </label>
            <div className="mt-2 flex gap-2">
              {(["T0", "T1", "T2"] as const).map((tier) => {
                const active = tb.matchability.tier_support[tier];
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() =>
                      handleField(
                        `tagBlock.matchability.tier_support.${tier}`,
                        !active,
                      )
                    }
                    className={`px-3 py-1 rounded text-xs border transition-colors ${
                      active
                        ? "bg-emerald-900/60 border-emerald-500 text-emerald-100"
                        : "bg-gray-900 border-gray-700 text-gray-400"
                    }`}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>
          </div>
          <EditableField
            label="Entity Class Filter (comma-sep)"
            value={tb.matchability.entity_class_filter.join(", ")}
            fieldPath="tagBlock.matchability.entity_class_filter"
            onChange={(path, value) =>
              handleField(
                path,
                value
                  .split(/\s*,\s*/)
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </div>
      </section>
    </div>
  );
}
