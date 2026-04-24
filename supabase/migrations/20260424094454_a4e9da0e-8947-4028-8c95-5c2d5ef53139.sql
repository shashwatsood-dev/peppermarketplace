UPDATE public.clients SET pod_name = CASE pod_name
  WHEN 'Integrated' THEN 'Aamir'
  WHEN 'India B2B' THEN 'Sumit'
  WHEN 'US B2B' THEN 'Neema'
  WHEN 'FMCG' THEN 'Sneha'
  WHEN 'BFSI' THEN 'Aditya'
  ELSE pod_name
END
WHERE pod_name IN ('Integrated','India B2B','US B2B','FMCG','BFSI');

UPDATE public.requisitions SET pod_name = CASE pod_name
  WHEN 'Integrated' THEN 'Aamir'
  WHEN 'India B2B' THEN 'Sumit'
  WHEN 'US B2B' THEN 'Neema'
  WHEN 'FMCG' THEN 'Sneha'
  WHEN 'BFSI' THEN 'Aditya'
  ELSE pod_name
END
WHERE pod_name IN ('Integrated','India B2B','US B2B','FMCG','BFSI');