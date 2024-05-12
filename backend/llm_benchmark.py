from transformers import AutoModel, AutoTokenizer, AutoModelForCausalLM, LlamaForCausalLM, LlamaTokenizerFast
from peft import PeftModel  # 0.5.0


import os
import datasets


template_dict = {
    'default': 'Instruction: {instruction}\nInput: {input}\nAnswer: '
}

lora_module_dict = {
    'chatglm2': ['query_key_value'],
    'falcon': ['query_key_value'],
    'bloom': ['query_key_value'],
    'internlm': ['q_proj', 'k_proj', 'v_proj'],
    'llama2': ['q_proj', 'k_proj', 'v_proj'],
    'qwen': ["c_attn"],
    'mpt': ['Wqkv'],
}


def get_prompt(template, instruction, input):

    if instruction:
        return template_dict[template].format(instruction=instruction, input=input)
    else:
        return input


def test_mapping(args, feature):

    prompt = get_prompt(
        args.instruct_template,
        feature['instruction'],
        feature['input']
    )
    return {
        "prompt": prompt,
    }


def tokenize(args, tokenizer, feature):

    prompt = get_prompt(
        args.instruct_template,
        feature['instruction'],
        feature['input']
    )
    prompt_ids = tokenizer(
        prompt, padding=False,
        max_length=args.max_length, truncation=True
    )['input_ids']
    target_ids = tokenizer(
        feature['output'].strip(), padding=False,
        max_length=args.max_length, truncation=True,
        add_special_tokens=False
    )['input_ids']

    input_ids = prompt_ids + target_ids
    exceed_max_length = len(input_ids) >= args.max_length

    # Add EOS Token
    if input_ids[-1] != tokenizer.eos_token_id and not exceed_max_length:
        input_ids.append(tokenizer.eos_token_id)

    label_ids = [tokenizer.pad_token_id] * len(prompt_ids) + input_ids[len(prompt_ids):]

    return {
        "input_ids": input_ids,
        "labels": label_ids,
        "exceed_max_length": exceed_max_length
    }


def parse_model_name(name, from_remote=False):

    if name == 'chatglm2':
        return 'THUDM/chatglm2-6b' if from_remote else 'base_models/chatglm2-6b'
    elif name == 'llama2':
        return 'meta-llama/Llama-2-7b-hf' if from_remote else 'base_models/Llama-2-7b-hf'
        # return 'NousResearch/Llama-2-7b-hf' if from_remote else 'base_models/Llama-2-7b-hf-nous'
    elif name == 'falcon':
        return 'tiiuae/falcon-7b' if from_remote else 'base_models/falcon-7b'
    elif name == 'internlm':
        return 'internlm/internlm-7b' if from_remote else 'base_models/internlm-7b'
    elif name == 'qwen':
        return 'Qwen/Qwen-7B' if from_remote else 'base_models/Qwen-7B'
    elif name == 'mpt':
        return 'cekal/mpt-7b-peft-compatible' if from_remote else 'base_models/mpt-7b-peft-compatible'
        # return 'mosaicml/mpt-7b' if from_remote else 'base_models/mpt-7b'
    elif name == 'bloom':
        return 'bigscience/bloom-7b1' if from_remote else 'base_models/bloom-7b1'
    else:
        raise ValueError(f"Undefined base model {name}")


def load_dataset(names, from_remote=False):
    dataset_names = [d for d in names.split(',')]
    dataset_list = []
    for name in dataset_names:
        rep = 1
        if not os.path.exists(name):
            rep = int(name.split('*')[1]) if '*' in name else 1
            name = ('FinGPT/fingpt-' if from_remote else 'data/fingpt-') + name.split('*')[0]
        tmp_dataset = datasets.load_from_disk(name)
        if 'test' not in tmp_dataset:
            tmp_dataset = tmp_dataset.train_test_split(0.2, shuffle=True, seed=42)

        dataset_list.extend([tmp_dataset] * rep)
    return dataset_list



def load_model(base_model, peft_model, from_remote=True):

    model_name = parse_model_name(base_model, from_remote)

    model = AutoModelForCausalLM.from_pretrained(
        model_name, offload_folder="offload", offload_state_dict = True, trust_remote_code=True,
        device_map="auto",
    )
    model.model_parallel = True

    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)

    tokenizer.padding_side = "left"
    if base_model == 'qwen':
        tokenizer.eos_token_id = tokenizer.convert_tokens_to_ids('<|endoftext|>')
        tokenizer.pad_token_id = tokenizer.convert_tokens_to_ids('<|extra_0|>')
    if not tokenizer.pad_token or tokenizer.pad_token_id == tokenizer.eos_token_id:
        tokenizer.add_special_tokens({'pad_token': '[PAD]'})
        model.resize_token_embeddings(len(tokenizer))

    model = PeftModel.from_pretrained(model, peft_model)
    model = model.eval()
    return model, tokenizer


def test_demo(model, tokenizer):

    for task_name, input, instruction in zip(demo_tasks, demo_inputs, demo_instructions):
        prompt = 'Instruction: {instruction}\nInput: {input}\nAnswer: '.format(
            input=input,
            instruction=instruction
        )
        inputs = tokenizer(
            prompt, return_tensors='pt',
            padding=True, max_length=512,
            return_token_type_ids=False
        )
        inputs = {key: value.to(model.device) for key, value in inputs.items()}
        res = model.generate(
            **inputs, max_length=512, do_sample=False,
            eos_token_id=tokenizer.eos_token_id
        )
        output = tokenizer.decode(res[0], skip_special_tokens=True)
        print(f"\n==== {task_name} ====\n")
        print(output)


FROM_REMOTE=True

base_model = 'falcon'
peft_model = 'FinGPT/fingpt-mt_falcon-7b_lora' if FROM_REMOTE else 'finetuned_models/MT-falcon-linear_202309210126'

model, tokenizer = load_model(base_model, peft_model, FROM_REMOTE)

demo_tasks = [
    'Financial Sentiment Analysis',
    'Financial Relation Extraction',
    'Financial Headline Classification',
    'Financial Named Entity Recognition',
]
demo_inputs = [
    "Glaxo's ViiV Healthcare Signs China Manufacturing Deal With Desano",
    "Apple Inc Chief Executive Steve Jobs sought to soothe investor concerns about his health on Monday, saying his weight loss was caused by a hormone imbalance that is relatively simple to treat.",
    'gold trades in red in early trade; eyes near-term range at rs 28,300-28,600',
    'This LOAN AND SECURITY AGREEMENT dated January 27 , 1999 , between SILICON VALLEY BANK (" Bank "), a California - chartered bank with its principal place of business at 3003 Tasman Drive , Santa Clara , California 95054 with a loan production office located at 40 William St ., Ste .',
]
demo_instructions = [
    'What is the sentiment of this news? Please choose an answer from {negative/neutral/positive}.',
    'Given phrases that describe the relationship between two words/phrases as options, extract the word/phrase pair and the corresponding lexical relationship between them from the input text. The output format should be "relation1: word1, word2; relation2: word3, word4". Options: product/material produced, manufacturer, distributed by, industry, position held, original broadcaster, owned by, founded by, distribution format, headquarters location, stock exchange, currency, parent organization, chief executive officer, director/manager, owner of, operator, member of, employer, chairperson, platform, subsidiary, legal form, publisher, developer, brand, business division, location of formation, creator.',
    'Does the news headline talk about price going up? Please choose an answer from {Yes/No}.',
    'Please extract entities and their types from the input sentence, entity types should be chosen from {person/organization/location}.',
]

def main():
    test_demo(model, tokenizer)